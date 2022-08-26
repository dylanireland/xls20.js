const xrpl = require("xrpl")

async function main(args) {

  if (args.length < 3) {
    throw new Error("Please provide args")
  }

  // This generates a random wallet, use fromSeed or check out the other Wallet methods here: https://js.xrpl.org/classes/Wallet.html
  const wallet = xrpl.Wallet.generate()

  const client = new xrpl.Client("wss://xls20-sandbox.rippletest.net:51233")
  await client.connect()

  if (args.length == 4) {
    if (args[3] == "fund") {
      try {
        console.log(await fundWallet(client, wallet))
      } catch(error) {
        throw new Error(error)
      }
    } else {
      throw new Error("Invalid 2nd argument")
    }
  }

  if (args[2] == "mint") {
    try {
      console.log(await mint(client, wallet))
    } catch(error) {
      throw new Error(error)
    }
  } else if (args[2] == "account_info") {
    try {
      console.log(await getAccountInfo(client, wallet.address))
    } catch(error) {
      throw new Error(error)
    }
  } else {
    throw new Error("Incorrect argument")
  }

  console.log("Exiting successfully... Goodbye!")
  client.disconnect()
}

async function getAccountInfo(client, walletAddress) {
  return new Promise((resolve, reject) => {
    client.request({
        "command": "account_info",
        "account": walletAddress,
        "ledger_index": "validated"
      }).then((response) => {
        resolve(response)
      }).catch((error) => {
        reject(error)
      })
  })
}

async function fundWallet(client, wallet) {
  return new Promise((resolve, reject) => {
    client.fundWallet(wallet).then((response) => {
      resolve(response)
    }).catch((error) => {
      reject(error)
    })
  })
}

async function mint(client, wallet) {
  var jsontx = {
    "TransactionType": "NFTokenMint",
    "Account": wallet.classicAddress,
    "TransferFee": 5000, // 5% transfer fee
    "NFTokenTaxon": 0,
    "Flags": 9, //Burnable and transferable
    "URI": xrpl.convertStringToHex("https://xdragons.io/static/photos/testassets/1.png"),
  }

  const tx = await client.submitAndWait(jsontx, { wallet: wallet })

  const nfts = await client.request({
		method: "account_nfts",
		account: wallet.address
	})
	console.log(nfts)

	// Check transaction results -------------------------------------------------
	console.log("Transaction result:", tx.result.meta.TransactionResult)
	console.log("Balance changes:", JSON.stringify(xrpl.getBalanceChanges(tx.result.meta), null, 2))
}

main(process.argv)
