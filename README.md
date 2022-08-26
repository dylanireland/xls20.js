# XLS-20 Minting Script

This script was written to test the minting of NFTs on the XRPL XLS-20 devnet. This script is being build out behind the scenes to handle the mint of Xdragons on the XRPL.

The entire source will be available upon [Xdragons](https://xdragons.io) mint.

View the results of this script's execution live at [xdragons.io/test/nft](https://xdragons.io/test/nft)

## Install

To install, clone the repository

```bash
git clone https://github.com/dylanireland/xls20-mint-js.git
cd xls20-mint-js/
```

Then install `npm` packages

```bash
npm install
```

## Execute

This script utilizes command line arguments to perform different tasks

By default, the script will generate a random wallet on the fly, so you will need to fund it each time by passing "fund" as the second argument

The first argument should be "mint" or "account_info"

Example:

```bash
node index.js mint fund
```

or

```bash
node index.js account_info fund
```

By changing [line 10](./index.js#L10) to `xrpl.Wallet.fromSeed` or any of the other [key derivation methods](https://js.xrpl.org/classes/Wallet.html) you may use a prefunded account and omit the "fund" argument

