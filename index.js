const xrpl = require("xrpl")
require('dotenv').config()

async function main(args) {

  if (args.length < 3) {
    throw new Error("Please provide args. Run 'node index.js help' for help.")
  } else if (args.length > 4) {
    throw new Error("Too many arguments")
  }

  if (args[2] == "help") {
    if (args.length == 4) {
      switch (args[3]) {
        case "generate":
          console.log("To generate a new wallet and retrieve the corresponding seed, run 'node index.js generate'.")
          console.log("From there, place your seed in the .env file in this directory.")
          break
        case "fund":
          console.log("Once you generate a seed and place it in .env, run 'node index.js fund SEED' to fund the wallet. If you'd like to fund the buyer wallet, run 'node index.js fund BUYER'.")
          console.log("See: 'node index.js help generate'.")
          break
        case "mint":
          console.log("To mint an NFT with the data in the mint() function, run 'node index.js mint'.")
          break
        case "account_info":
          console.log("To get info on the account of the wallet derived from the seed in .env, run 'node index.js account_info'")
          break
        case "account_nfts":
          console.log("Run 'node index.js account_info' to get a list of the nfts owned by an account")
          break
        case "create_whitelist_sell_offer":
          console.log("Run 'node index.js create_whitelist_sell_offer DESTINATION' where DESTINATION is the public key of another XRPL account to create a private sell offer to that account")
          break
        case "accept_sell_offer":
          console.log("Run 'node index.js accept_sell_offer OFFER_HASH' where OFFER_HASH is the Hash256 of the TokenSellOffer. This command will require that BUYER is set in .env")
          console.log("See: 'node index.js generate'.")
          break
        default:
          throw new Error("Invalid help page")
      }
    } else {
      console.log("Available help commands are:")
      console.log("node index.js help generate")
      console.log("node index.js help fund")
      console.log("node index.js help mint")
      console.log("node index.js help account_info")
      console.log("node index.js help account_nfts")
      console.log("node index.js help create_whitelist_sell_offer")
      console.log("node index.js help accept_sell_offer")
      console.log("node index.js help transient_pubkey")
    }
    return
  }
  
  var wallet, buyer

  if (process.env.SEED != null) {
    try {
      wallet = xrpl.Wallet.fromSeed(process.env.SEED)
    } catch {
      throw new Error("Could not parse seed. Is your SEED environment variable a valid seed?")
    }
  }

  if (process.env.BUYER != null) {
    try {
      buyer = xrpl.Wallet.fromSeed(process.env.BUYER)
    } catch {
      throw new Error("Could not parse buyer seed. Is your BUYER environment variable a valid seed?")
    }
  }
  

  const client = new xrpl.Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()


  if (args[2] == "generate") {
    wallet = xrpl.Wallet.generate()
    console.log(`A new wallet has been generated for you with the seed ${wallet.seed}`)
    console.log(`Please copy the following line into the .env file within this directory to use this wallet`)
    console.log(`SEED=${wallet.seed}`)
    console.log(`If instead you'd like to use this as the hypothetical 'buyer' address, place the following in .env`)
    console.log(`BUYER=${wallet.seed}`)
  } else if (args[2] == "fund") {
    if (args.length < 4) {
      throw new Error("Please specify SEED or BUYER")
    }
    if (args[3].toLowerCase() == "seed") {
      if (process.env.SEED != null) {
        // Have already done SEED validation at this point
        try {
          console.log(await fundWallet(client, wallet))
        } catch(error) {
          throw new Error(error)
        }
      } else {
        throw new Error("No wallet to fund")
      }
    } else if (args[3].toLowerCase() == "buyer") {
      if (process.env.BUYER != null) {
        try {
          console.log(await fundWallet(client, buyer))
        } catch(error) {
          throw new Error(error)
        }
      } else {
        throw new Error("No wallet to fund")
      }
    } else {
      throw new Error("Please use SEED or BUYER for the last argument. See `node index.js help fund`")
    }
    
  } else if (args[2] == "mint") {
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
  } else if (args[2] == "account_nfts") {
    try {
      console.log(await getAccountNFTs(client, wallet.address))
    } catch(error) {
      throw new Error(error)
    }
  } else if (args[2] == "create_whitelist_sell_offer") {
    try {
      console.log(await createWhitelistSellOfferFor(args[3], client, wallet))
    } catch(error) {
      throw new Error(error)
    }
  } else if (args[2] == "accept_sell_offer") {
    try {
      console.log(await acceptSellOffer(args[3], client, buyer, wallet))
    } catch(error) {
      throw new Error(error)
    }
  } else if (args[2] == "transient_pubkey") {
    try {
      console.log(await createFundGetPubkey(client))
    } catch(error) {
      throw new Error(error)
    }
  } else {
    throw new Error("Incorrect argument")
  }

  console.log("Exiting successfully... Goodbye!")
  client.disconnect()
}

async function getLedgerVersion(client) {
  // XRPL uses ledger versions and a tx will fail if the LastLedgerSequence provided with the transaction becomes outdated. Due to the high speed of block throughput,
  // with WebSockets our tx often becomes outdated. For this reason, we give a reasonable buffer of 4 (specified 'reasonable' by XRPL).
  // See https://xrpl.org/reliable-transaction-submission.html#lastledgersequence
  // This is wrong^ But this can actually be useful like potentially using this to await the activation of XLS-20 and deploy immediately.
  return new Promise((resolve, reject) => {
    client.request({
        "command": "ledger_current",
      }).then((response) => {
        resolve(response.result.ledger_current_index)
      }).catch((error) => {
        reject(error)
      })
  })
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

async function getAccountNFTs(client, walletAddress) {
  return new Promise((resolve, reject) => {
    client.request({
      method: "account_nfts",
      account: walletAddress
    }).then((nfts) => {
      resolve(nfts.result.account_nfts)
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

async function createFundGetPubkey(client) {
  const wallet = xrpl.Wallet.generate()
  await fundWallet(client, wallet)
  return wallet.classicAddress
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

  printTxResults(tx)

	
}

async function createWhitelistSellOfferFor(destination, client, wallet) {
  const jsontx = {
    "TransactionType": "NFTokenCreateOffer",
    "NFTokenID": "000913885B1B4434ABDBC12F864FB3FECED7ADBA5A6E58E616E5DA9C00000001",
    "Amount": "1000000", // 1 XRP
    "Account": wallet.classicAddress, // Us, the minter
    "Flags": 1,
  }

  let tx

  try {
    tx = await client.submitAndWait(jsontx, { wallet: wallet })
  } catch(error) {
    console.log(error)
    return
  }
  

  console.log(tx.result)
  console.log(tx.result.meta.AffectedNodes)
}

async function acceptSellOffer(token, client, buyer, wallet) {
  if (buyer == null) {
    throw new Error("Please specify the BUYER in .env. See 'node index.js generate.")
  }

  const jsontx = {
    "TransactionType": "NFTokenAcceptOffer",
    "NFTokenSellOffer": token,
    "Account": buyer.classicAddress, // The buyer
  }

  let tx

  try {
    tx = await client.submitAndWait(jsontx, { wallet: buyer })
  } catch(error) {
    console.log(error)
    return
  }
  

  console.log(tx)
}

function printTxResults(tx) {
  // Check transaction results -------------------------------------------------
  console.log("Transaction result:", tx.result.meta.TransactionResult)
  console.log("Balance changes:", JSON.stringify(xrpl.getBalanceChanges(tx.result.meta), null, 2))
}

main(process.argv)
