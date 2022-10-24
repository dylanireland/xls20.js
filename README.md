# XLS-20 Minting Script

This script was written to test the minting of NFTs on the XRPL XLS-20 devnet. This script is being build out behind the scenes to handle the mint of Xdragons on the XRPL.

The entire source will be available upon [Xdragons](https://xdragons.io) mint.

View the results of this script's execution live at [xdragons.io/test](https://xdragons.io/test)

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

This script utilizes command line arguments and environment variables to perform different tasks.

If you'd like to use your own wallet, insert the seed into the file *.env* as `SEED=YOUR_SEED`.

### Generate

If you'd like to generate a new wallet, run:

```bash
node index.js generate
```

Then copy the value and paste it in your *.env* file as mentioned above.

### Fund

To fund your account with test XRP, run:

```bash
node index.js fund
```

*Note: This will not work on the XRPL mainnet*

### Mint

To mint an NFT with the data in the `mint` function, run:

```bash
node index.js mint
```

### Account Info

To get the info of your XRPL account, run:

```bash
node index.js account_info
```

### Account Specific NFT Info

To get the NFT info of your XRPL account, run:

```bash
node index.js account_nfts
```

### Create Whitelist Sale Offer

In order to support a whitelist sale mechanism, we need to create sell offers to each of the whitelisters.

Achieve this by running:

```bash
node index.js create_whitelist_sell_offer WHITELISTER_PUBLIC_KEY
```

Replace `WHITELISTER_PUBLIC_KEY` with the whitelister's public key.

### Create Transient Public Key

Create a new temporary wallet and fund it and return the public key.

```bash
node index.js transient_pubkey
```



