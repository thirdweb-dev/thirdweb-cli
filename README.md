<p align="center">
<br />
<a href="https://thirdweb.com"><img src="https://github.com/thirdweb-dev/typescript-sdk/blob/main/logo.svg?raw=true" width="200" alt=""/></a>
<br />
</p>
<h1 align="center">thirdweb CLI</h1>
<p align="center">
<a href="https://www.npmjs.com/package/@thirdweb-dev/cli"><img src="https://img.shields.io/npm/v/@thirdweb-dev/cli?color=red&logo=npm" alt="npm version"/></a>
<a href="https://discord.gg/thirdweb"><img alt="Join our Discord!" src="https://img.shields.io/discord/834227967404146718.svg?color=7289da&label=discord&logo=discord&style=flat"/></a>

</p>
<p align="center"><strong>Publish and deploy smart contracts without dealing with private keys</strong></p>
<br />

## Getting started

The thirdweb CLI is your one-stop-shop for publishing custom contracts for your team or the world to use. The CLI uploads all necessary data to decentralized storage and makes it available to deploy via the thirdweb sdk or thirdweb dashboard.

This brings all the capabilities of thirdweb to your own custom contracts.
## Deploying your contract

Once your contract code is setup like above, you can now publish it by running:

```shell
npx thirdweb@latest deploy
```

Alternatively, you install the CLI as a global command on your machine:

```shell
npm i -g @thirdweb-dev/cli
thirdweb deploy
```

This command will:

- auto-detect any contracts in your project
- compile your project
- Upload ABIs to IPFS
- Open the deploy flow in your thirdweb dashboard in a browser

From the thirdweb dashboard, you can review and deploy your contracts.

## Detecting contract extensions

As you're developing your contracts, you may want to implement [Contract Extensions](https://portal.thirdweb.com/thirdweb-deploy/contract-extensions) to add standard functionality to your contracts like NFT minting, querying, and more. During your development, you can run the `thirdweb detect` command to detect any extensions on your contracts for confirmation and to suggest additionaly related extensions.

Again, you can run the command either by running the following:

```shell
npx thirdweb@latest detect
```

Or by installing the CLI as a global command on your machine:
```shell
npm i -g @thirdweb-dev/cli
thirdweb detect
```

---

## Commands

- `thirdweb deploy` - Compile & deploy contracts through your dashboard
- `thirdweb publish` - Compile & publish contracts, makes them available for easy deployment later directly from your dashboard.
- `thirdweb detect` - Detect which thirdweb contract extensions are implemented in your contracts and suggest related extensions to implement

---

## Supported projects

To publish, you need to be in a directory that contains a project which the CLI is compatible
with. The projects we support so far:

- hardhat
- forge
- truffle
- brownie
- solc

<!-- Coming soon: -->

---

## Running the examples

Clone the repo and run this command after installing the CLI tool:

```bash
$ cd examples/hardhat
$ thirdweb publish
```

## Local Development

The simplest way to work on the CLI locally is to:

1. Install the package locally
2. Run the `build:watch` command to compile any changes in realtime

```bash
$ npm install -g ./
$ yarn run build:watch
```
