const xrpl = require("xrpl")

async function main() {

  // Define the network client
  const client = new xrpl.Client("wss://xls20-sandbox.rippletest.net:51233")
  await client.connect()

  const test_wallet = xrpl.Wallet.fromSeed("snJnHefN7hCbTCmu8TPYDFzvvZe7S")
  //Seq # 3261361
  //console.log(await fundWallet(client, test_wallet))

  const response = await client.request({
    "command": "account_info",
    "account": test_wallet.address,
    "ledger_index": "validated"
  })

  console.log(response)
  await mint(client, test_wallet)

  // Disconnect when done (If you omit this, Node.js won't end the process)
  client.disconnect()
}

async function fundWallet(client, wallet) {
  const result = await client.fundWallet(wallet)
  return result
}

async function mint(client, test_wallet) {
  var jsontx = {
    "TransactionType": "NFTokenMint",
    "Account": test_wallet.classicAddress,
    "TransferFee": 5000,
    "NFTokenTaxon": 0,
    "Flags": 9, //Burnable and transferable
    "URI": xrpl.convertStringToHex("https://xdragons.io/static/photos/testassets/1.png"),
  }

  const tx = await client.submitAndWait(jsontx, { wallet: test_wallet })

  const nfts = await client.request({
		method: "account_nfts",
		account: test_wallet.address
	})
	console.log(nfts)

	// Check transaction results -------------------------------------------------
	console.log("Transaction result:", tx.result.meta.TransactionResult)
	console.log("Balance changes:", JSON.stringify(xrpl.getBalanceChanges(tx.result.meta), null, 2))
}

main()
