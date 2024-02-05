# xls20.js

xls20.js is a JavaScript library that can be used to interact with [XLS-20 NFTs](https://github.com/XRPLF/XRPL-Standards/discussions/46) and supports all currently available [NFToken transaction types](https://xrpl.org/known-amendments.html#nonfungibletokensv1).

## Install

### With npm

```bash
npm install xls20
```

### From Source

Or reference from source

```bash
git clone https://github.com/dylanireland/xls20.js.git
cd xls20.js/
npm install
```

## Documentation

Documentation is written in the source and displayed using [JSDoc](https://jsdoc.app/).

Read the reference documentation [here](https://xdragons.io/xls20js/reference).

## Example Usage

### Import Package

```javascript
const XLS20 = require('xls20')
```

### Instantiate XLS20 and Connect to Devnet

```javascript
const network = "Devnet"
const seed = "sEdV82hVrg1hYKrPcYtanw6oEypn6VW"
const xls20 = new XLS20(network, seed)
await xls20.connect()
```

### Or to Generate a Wallet on the Fly

```javascript
const network = "Devnet"
const xls20 = new XLS20(network)
await xls20.connect()
```

### Fund Wallet

```javascript
console.log(await xls20.fundWallet())
```

Response:

```
{
  wallet: Wallet {
    publicKey: 'ED1899DC4EAB06FBD32DF013094B230E225CDA8772A47DA4911E0068E5DC7B6B05',
    privateKey: 'EDD5CD784B52C4C5FC46D090E0FC22A224514D761DF7CCC0617A06C589FE97D8C9',
    classicAddress: 'r9yV4F4cPjrs15tcd43E2wXUD2sQx4Beek',
    seed: 'sEd7rpTaAVzeJAqonQwuB2QrcRQQvYD'
  },
  balance: 1000
}
```

### Mint NFT

```javascript
const transferFee = 5000 // 5%
const flags = 9 // Burnable and transferable
const uri = "ipfs://MeTaDaTaUrIed84ca32c32342eca83d" // Metadata URI
const mintResponse = await xls20.mint(transferFee, flags, uri)
console.log(mintResponse)
```

Response:

```
{
  id: 15,
  result: {
    Account: 'rU32vbeoRu9TPigMXbJwqxRhWZsXdDJ5Ny',
    Fee: '12',
    Flags: 9,
    ...
    URI: '68747470733A2F2F78647261676F6E732E696F2F7374617469632F70686F746F732F746573746173736574732F312E706E67',
    ...
    meta: {
      AffectedNodes: [Array],
      ...
    },
    validated: true
  },
  type: 'response'
}
```

*Note: The juicy stuff is in `result.meta.AffectedNodes`*

### Create a Public Sell Offer

```javascript
const nfTokenID = mintResponse.result.meta.AffectedNodes.filter(obj => 'CreatedNode' in obj)[0].CreatedNode.NewFields.NFTokens[0].NFToken.NFTokenID;
const salePrice = 500_000_000 // In drops (500 XRP here)
console.log(await xls20.createSellOffer(nfTokenID, salePrice))
```

Response:

```
{
  id: 17,
  result: {
    Account: 'r9yV4F4cPjrs15tcd43E2wXUD2sQx4Beek',
    Amount: '500000000',
    Fee: '12',
    ...
    ...
    meta: {
      AffectedNodes: [Array],
      ...
    },
    validated: true
  },
  type: 'response'
}
```

*Note: The juicy stuff is in `result.meta.AffectedNodes`*

### More

It does more, [read the docs](https://xdragons.io/xls20js/reference)!

## Dependencies

This SDK depends only on [xrpl.js](https://github.com/XRPLF/xrpl.js/).
