const xrpl = require("xrpl");

/**
 * The XLS20 Class is used to interact with XLS20 NFTs on the XRPL. To use XLS20.js, use `import XLS20 from 'xls20`.
 * Built for [Xdragons](https://xdragons.io), usable anywhere.
 * 
 * @author Dylan Ireland <dylan.ireland777@gmail.com>
 */
export class XLS20 {
  /**
   * Constructs a new XLS20 object
   * 
   * @constructor
   * @param {string} walletSeed - The seed of the wallet used to deploy transactions.
   * @param {string} network - The network with which to deploy transactions. Options are "Devnet"
   */
  constructor(walletSeed, network) {
    this.wallet = xrpl.Wallet.fromSeed(walletSeed);
    switch (network) {
      case "Devnet": this.network = { "Devnet": "wss://s.devnet.rippletest.net:51233" }; break;
      default: throw new Error("Invalid Network. Options are \"Devnet\"");
    }
    this.client = new xrpl.Client(this.network);
    this.client.connect();
  }

  /**
   * Awaits the connection of the instance's XRPL client to the network.
   * 
   * @example
   * ```
   * const xls20 = new XLS20(walletSeed, network);
   * try {
   *  await xls20.awaitConnection();
   * } catch(error) {
   *  // handle error
   * }
   * // Use `xls20`...
   * ```
   */
  async awaitConnection() {
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
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
    }

    if (!("Devnet" in this.network)) {
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
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
    }

    return client.request({
      "command": "account_info",
      "account": this.wallet.classicAddress,
      "ledger_index": "validated"
    });
  }
  
  /**
   * Gets the NFTs owned by this instance's `wallet`.
   * 
   * @returns {Promise} A `Promise` that resolves to a successful query, or rejects with an error.
   */
  getAccountNFTs(client, walletAddress) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
    }

    return client.request({
      method: "account_nfts",
      account: walletAddress
    });
  }

  /**
   * Creates and deploys an NFTokenMint transaction
   * 
   * @param {string} transferFee - The fee applied when the NFT is transferred, in tenths of a basis point (i.e. 5000 == 5%).
   * @param {number} flags - The flags to be applied to the NFT.
   * @param {string} uri - The URI of the metadata associated with the NFT.
   * @param {string=} receiverAddress - The XRPL account that the NFT should be minted to. If not provided, `this.wallet.classicAddress` is used.
   * @returns {Promise} A `Promise` that resolves to a successful execution result, or rejects with an error.
   */
  mint(transferFee, flags, uri, receiverAddress) {
    if (!this.client.isConnected()) {
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    var jsontx = {
      "TransactionType": "NFTokenMint",
      "Account": receiverAddress,
      "TransferFee": transferFee, // In 10ths of a basis-point. i.e. 5000 == 5%
      "NFTokenTaxon": 0,
      "Flags": flags, //Burnable and transferable is 9
      "URI": xrpl.convertStringToHex(uri),
    }
  
    return client.submitAndWait(jsontx, { wallet: this.wallet })
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
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    var jsontx = {
      "TransactionType": "NFTokenCreateOffer",
      "NFTokenID": nfTokenID,
      "Amount": salePrice,
      "Account": account,
      "Flags": 1,
    }

    if (destination != null) {
      jsontx["Destination"] = destination;
    }

    if (expiration != null) {
      jsontx["Expiration"] = expiration;
    }

    return client.submitAndWait(jsontx, { wallet: this.wallet })
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
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
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

    return client.submitAndWait(jsontx, { wallet: this.wallet })
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
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    var jsontx = {
      "TransactionType": "NFTokenAcceptOffer",
      "NFTokenBuyOffer": nfTokenBuyOffer,
      "Account": account,
    }

    return client.submitAndWait(jsontx, { wallet: this.wallet })
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
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
    }

    if (account == null) {
      account = this.wallet.classicAddress;
    }

    const jsontx = {
      "TransactionType": "NFTokenAcceptOffer",
      "NFTokenSellOffer": nfTokenSellOffer,
      "Account": account,
    }

    return client.submitAndWait(jsontx, { wallet: this.wallet })
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
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
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

    return client.submitAndWait(jsontx, { wallet: this.wallet })
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
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
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
        throw new Error("Illegal duplicate assignment to `owner` and `account`. Please use different values or omit `owner`");
      }
      jsontx["Owner"] = owner;
    }

    return client.submitAndWait(jsontx, { wallet: this.wallet })
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
      throw new Error("Client is not connected to the network. If you'd like to await connection, see `awaitConnection()`");
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

    return client.submitAndWait(jsontx, { wallet: this.wallet })
  }
}