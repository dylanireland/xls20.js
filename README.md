# xls20.js

xls20.js is an SDK that can be used to interact with [XLS-20 NFTs](https://github.com/XRPLF/XRPL-Standards/discussions/46) and supports all currently available [NFToken transaction types](https://xrpl.org/known-amendments.html#nonfungibletokensv1).

xls20.js was built by the [Xdragons](https://xdragons.io) team in order to interact with Xdragon NFTs, however this SDK can be used to interact with any XLS-20 NFT(s).

## Install

To install, clone the repository

```bash
git clone https://github.com/dylanireland/xls20.js.git
cd xls20.js/
```

Then install `npm` packages

```bash
npm install
```

## Documentation

Documentation is written in the source and displayed using [JSDoc](https://jsdoc.app/).

Read the reference documentation [here]().

## Example Usage

### Import Package

```javascript
import XLS20 from 'xls20';
```

### Instantiate XLS20 and Connect to Devnet

```javascript
const network = "Devnet";
const seed = "sEdV82hVrg1hYKrPcYtanw6oEypn6VW";
const xls20 = new XLS20(network, seed);
await xls20.connect();
```

### Or to Generate a Wallet on the Fly

```javascript
const network = "Devnet";
const xls20 = new XLS20(network);
await xls20.connect();
```

### Fund Wallet

```javascript
console.log(await xls20.fundWallet());
/*
 * wallet: Wallet {
 *  publicKey: 'ED36691C4A4510CC3C1DF14404BD75026D6BCC874B633BFDB9D0EEE4DA15793087',
 *  privateKey: 'EDA094BB54402A214196D7301F1CA4FF389D9F4BCB18AB4C0EE83C6E7672F754A8',
 *  classicAddress: 'rs8cmBJHGYpwYZERY8CYDoyaXgSVf86DPy',
 *  seed: 'sEdV82hVrg1hYKrPcYtanw6oEypn6VW'
 * },
 * balance: 1000
 */
```

### Mint NFT

```javascript
const transferFee = 5000; // 5%
const flags = 9; // Burnable and transferable
const uri = "ipfs://MeTaDaTaUrIed84ca32c32342eca83d" // Metadata URI
console.log(await xls20.mint(transferFee, flags, uri));
/*
 * {
 * id: 14,
 * result: {
 *   Account: 'rnpQeSLdo6FbqSxN1gbGPDA9vnLvkp16jZ',
 *   Fee: '12',
 *   Flags: 9,
 *   LastLedgerSequence: 22879163,
 *   ...
 *   ...
 *   meta: {
 *     AffectedNodes: [Array],
 *     ...
 *   },
 *   validated: true
 * },
 * type: 'response'
 * }
 */
```

*Note: The juicy stuff is in `result.meta.AffectedNodes`*

### More

It does more, [read the docs](docs)!

## Dependencies

This SDK depends only on [xrpl.js](https://github.com/XRPLF/xrpl.js/).
