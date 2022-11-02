const xrpl = require("xrpl");

/**
 * The XLS20 Class is used to interact with XLS20 NFTs on the XRPL. To use XLS20.js, use `import XLS20 from 'xls20`.
 * Built for [Xdragons](https://xdragons.io), usable anywhere.
 * 
 * @author Dylan Ireland <dylan.ireland777@gmail.com>
 */
class XLS20 {
  /**
   * Constructs a new XLS20 object
   * 
   * @constructor
   * @param {string} network - The network with which to deploy transactions. Options are "Devnet"
   * @param {string=} walletSeed - The seed of the wallet used to deploy transactions. If not provided, one will be generated.
   */
  constructor(network, walletSeed) {
    if (walletSeed) {
      this.wallet = xrpl.Wallet.fromSeed(walletSeed);
    } else {
      this.generateWallet();
    }
    
    switch (network) {
      case "Devnet": this.network = ["Devnet", "wss://s.devnet.rippletest.net:51233"]; break;
      case "Mainnet": this.network = ["Mainnet", "wss://xrplcluster.com/"]; break;
      default: this.network = ["Custom", network]; break;
    }

    this.client = new xrpl.Client(this.network[1]);
  }

  /**
   * Awaits the connection of the instance's XRPL client to the network.
   * 
   * @example
   * ```
   * const xls20 = new XLS20(walletSeed, network);
   * try {
   *  await xls20.connect();
   * } catch(error) {
   *  // handle error
   * }
   * // Use `xls20`...
   * ```
   */
  async connect() {
    try {
      await this.client.connect();
    } catch(error) {
      throw error;
    }
  }

  /**
   * Generates a new wallet and sets it to the instance's `wallet`.
   */
  generateWallet() {
    this.wallet = xrpl.Wallet.generate();
  }

  /**
   * Funds the instance's `wallet`.
   * This function only works on testnets and devnets.
   * 
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   */
  fundWallet() {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (this.network[0] != "Devnet") {
      throw new Error("This function only works on testnets and devnets");
    }
    return this.client.fundWallet(this.wallet);
  }

  /**
   * Gets the account info of this instance's `wallet`.
   * 
   * @returns {Promise} A `Promise` that resolves to a successful query, or rejects with an error.
   */
  getAccountInfo() {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    return this.client.request({
      "command": "account_info",
      "account": this.wallet.classicAddress,
      "ledger_index": "validated"
    });
  }
  
  /**
   * Gets the NFTs owned by `walletAddress`
   * 
   * @param {string=} walletAddress The wallet address to get the NFTs for, defaults to `this.wallet.classicAddress`
   * @param {number=} limit The limit on the number of token pages to retrieve. Cannot be fewer than 32 nor more than 400. Default value is 100
   * @param {Marker=} marker The value from a previous paginated response, allowing you to continue querying where you left off past the 400 limit. Markers are ephemeral and may not last more than 10 minutes.
   * @returns {Promise} A `Promise` that resolves to a successful query, or rejects with an error.
   */
  getAccountNFTs(walletAddress, limit, marker) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (walletAddress == null) {
      walletAddress = this.wallet.classicAddress
    }

    if (limit == null) {
      limit = 100
    } else if (limit > 400 || limit < 32) {
      throw new Error("Limit is out of bounds. Please use a value between 32 and 400")
    }

    let req = {
      method: "account_nfts",
      account: walletAddress,
      limit: limit
    }

    if (marker != null) {
      req.marker = marker
    }

    return this.client.request(req);
  }

  /**
   * Gets the NFTs owned by `walletAddress`
   * 
   * @param {string=} walletAddress The wallet address to get the NFTs for, defaults to `this.wallet.classicAddress`
   * @returns {Array} An array containing all of the accounts NFTs
   */
  async getAllAccountNFTs(walletAddress) {
    let tmp = []
    let firstRun = true
    let marker = null
    while (true) {
      firstRun = false
      const response = await this.getAccountNFTs(walletAddress, 400, marker)
      const nfts = response.result.account_nfts
      if (nfts.length == 0) {
        break
      }
      tmp = tmp.concat(nfts)
      if (nfts.length < 200) {
        break
      }
      marker = response.result.marker
    }
    return tmp
  }

  /**
   * Creates and deploys an NFTokenMint transaction
   * 
   * @param {string} transferFee - The fee applied when the NFT is transferred, in tenths of a basis point (i.e. 5000 == 5%).
   * @param {number} flags - The flags to be applied to the NFT.
   * @param {string} uri - The URI of the metadata associated with the NFT.
   * @param {string=} account - The XRPL account minting the NFT. If not provided, `this.wallet.classicAddress` is used.
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   */
  mint(transferFee, flags, uri, account) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    var jsontx = {
      "TransactionType": "NFTokenMint",
      "Account": account,
      "TransferFee": transferFee, // In 10ths of a basis-point. i.e. 5000 == 5%
      "NFTokenTaxon": 0,
      "Flags": flags, //Burnable and transferable is 9
      "URI": xrpl.convertStringToHex(uri),
    }
  
    return this.client.submitAndWait(jsontx, { wallet: this.wallet })
  }

  /**
   * Creates and deploys an NFTokenSellOffer
   * 
   * @param {string} nfTokenID - The NFTokenID of the NFT to create the NFTokenSellOffer for.
   * @param {number} salePrice - The sale price in [drops](https://xrpl.org/currency-formats.html#xrp-amounts).
   * @param {string=} account - The XRPL account the NFT resides in. If not provided, `this.wallet.classicAddress` is used.
   * @param {number=} expiration - The expiration date of the NFTokenSellOffer in seconds since the Ripple Epoch. If not provided, no expiration date is set.
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   */
   createSellOffer(nfTokenID, salePrice, account, expiration) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    salePrice = salePrice.toString();
    if (salePrice.includes("_")) {
      salePrice = salePrice.replace("_", "");
    }

    var jsontx = {
      "TransactionType": "NFTokenCreateOffer",
      "NFTokenID": nfTokenID,
      "Amount": salePrice,
      "Account": account,
      "Flags": 1,
    }

    if (expiration != null) {
      jsontx["Expiration"] = expiration;
    }

    return this.client.submitAndWait(jsontx, { wallet: this.wallet })
  }

  /**
   * Creates and deploys an NFTokenSellOffer
   * 
   * @param {string} nfTokenID - The NFTokenID of the NFT to create the NFTokenSellOffer for.
   * @param {number} salePrice - The sale price in [drops](https://xrpl.org/currency-formats.html#xrp-amounts).
   * @param {string} destination - The XRPL account that is permitted to take the NFTokenSellOffer
   * @param {string=} account - The XRPL account the NFT resides in. If not provided, `this.wallet.classicAddress` is used.
   * @param {number=} expiration - The expiration date of the NFTokenSellOffer in seconds since the Ripple Epoch. If not provided, no expiration date is set.
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   */
  createWhitelistSellOffer(nfTokenID, salePrice, destination, account, expiration) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    salePrice = salePrice.toString();
    if (salePrice.includes("_")) {
      salePrice = salePrice.replace("_", "");
    }

    var jsontx = {
      "TransactionType": "NFTokenCreateOffer",
      "NFTokenID": nfTokenID,
      "Amount": salePrice,
      "Account": account,
      "Destination": destination,
      "Flags": 1,
    }

    if (expiration != null) {
      jsontx["Expiration"] = expiration;
    }

    return this.client.submitAndWait(jsontx, { wallet: this.wallet })
  }

  /**
   * Creates and deploys an NFTokenBuyOffer
   * 
   * @param {string} nfTokenID - The NFTokenID of the NFT to create the NFTokenBuyOffer for
   * @param {number} purchasePrice - The purchase price in [drops](https://xrpl.org/currency-formats.html#xrp-amounts).
   * @param {string} destination - The XRPL account that is permitted to take the NFTokenSellOffer
   * @param {string=} account - The account making the request??. If not provided, `this.wallet.classicAddress` is used.
   * @param {number=} expiration - The expiration date of the NFTokenBuyOffer in seconds since the Ripple Epoch. If not provided, no expiration date is set.
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   */
   createBuyOffer(nfTokenID, purchasePrice, account, expiration) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    purchasePrice = purchasePrice.toString();
    if (purchasePrice.includes("_")) {
      purchasePrice = purchasePrice.replace("_", "");
    }

    var jsontx = {
      "TransactionType": "NFTokenCreateOffer",
      "NFTokenID": nfTokenID,
      "Amount": purchasePrice,
      "Account": account,
      "Flags": 0,
    }

    if (expiration != null) {
      jsontx["Expiration"] = expiration;
    }

    return this.client.submitAndWait(jsontx, { wallet: this.wallet })
  }

  /**
   * Accepts an NFTokenBuyOffer, thereby selling an NFT.
   * 
   * @param {string} nfTokenBuyOffer - The Hash256 of the NFTokenBuyOffer.
   * @param {string=} account - The account making the request??. If not provided, `this.wallet.classicAddress` is used.
   * 
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   */
   acceptBuyOffer(nfTokenBuyOffer, account) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    var jsontx = {
      "TransactionType": "NFTokenAcceptOffer",
      "NFTokenBuyOffer": nfTokenBuyOffer,
      "Account": account,
    }

    return this.client.submitAndWait(jsontx, { wallet: this.wallet })
  }

  /**
   * Accepts an NFTokenSellOffer, thereby buying an NFT.
   * 
   * @param {string} nfTokenSellOffer - The Hash256 of the NFTokenSellOffer.
   * @param {string=} account - The account making the request??. If not provided, `this.wallet.classicAddress` is used.
   * 
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   */
   acceptSellOffer(nfTokenSellOffer, account) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    const jsontx = {
      "TransactionType": "NFTokenAcceptOffer",
      "NFTokenSellOffer": nfTokenSellOffer,
      "Account": account,
    }

    return this.client.submitAndWait(jsontx, { wallet: this.wallet })
  }

  /**
   * Executes an NFTokenAcceptOffer in brokered mode, market-making a buy and a sell offer.
   * 
   * @param {string} nfTokenBuyOffer - The Hash256 of the NFTokenBuyOffer.
   * @param {string} nfTokenSellOffer - The Hash256 of the NFTokenSellOffer.
   * @param {number=} brokerFee - The fee that the broker keeps as the market-making cost. If not specified, the fee will be 0.
   * @param {string=} account - The account making the request??. If not provided, `this.wallet.classicAddress` is used.
   * 
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   */
   brokerNFTSale(nfTokenBuyOffer, nfTokenSellOffer, brokerFee, account) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    var jsontx = {
      "TransactionType": "NFTokenAcceptOffer",
      "NFTokenBuyOffer": nfTokenBuyOffer,
      "NFTokenSellOffer": nfTokenSellOffer,
      "Account": account,
    }

    if (brokerFee != null) {
      jsontx["NFTokenBrokerFee"] = brokerFee;
    }

    return this.client.submitAndWait(jsontx, { wallet: this.wallet })
  }

  /**
   * Burns an NFT
   * 
   * @param {string} nfTokenID - The Hash256 of the NFTokenBuyOffer.
   * @param {string=} account - The account making the request??. If not provided, `this.wallet.classicAddress` is used.
   * @param {string=} owner - The owner of the NFToken to burn. Not required if the owner is the same as the account deploying the transaction.
   * 
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   * 
   * @throws An error if `owner` and `account` are the same string. To avoid this error, omit `owner`.
   */
   burn(nfTokenID, account, owner) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    var jsontx = {
      "TransactionType": "NFTokenBurn",
      "NFTokenID": nfTokenID,
      "Account": account,
    }

    if (owner != null) {
      if (owner == account) {
        throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
      }
      jsontx["Owner"] = owner;
    }

    return this.client.submitAndWait(jsontx, { wallet: this.wallet })
  }

  /**
   * Cancels a list of NFTokenOffers. If a single NFTokenOfferID is provided (NOT an array) it will be used solely.
   * 
   * @param {string[]} nfTokenOffers - A list of NFTokenOffers. If a single NFTokenOfferID is provided (*instead of* an array of NFTokenOfferIDs) it will be used solely.
   * @param {string=} account - The account making the request??. If not provided, `this.wallet.classicAddress` is used.
   * 
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   * 
   */
   cancelOffers(nfTokenOffers, account) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. Please run `xls20.connect()` before making requests.");
    }

    if (!Array.isArray(nfTokenOffers)) {
      nfTokenOffers = [nfTokenOffers];
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    var jsontx = {
      "TransactionType": "NFTokenCancelOffer",
      "NFTokenOffers": nfTokenOffers,
      "Account": account,
    }

    return this.client.submitAndWait(jsontx, { wallet: this.wallet })
  }
}

module.exports = XLS20;