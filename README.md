# `thirdweb cli`

The thirdweb CLI is your one-stop-shop for publishing custom contracts for your team or the world to use. The CLI uploads all necessary data to decentralized storage and makes it available to deploy via the thirdweb sdk or thirdweb dashboard.

This brings all the capabilities of thirdweb to your own custom contracts.

## 1. Extending ThirdwebContract

In order to publish a contract and get all the benefits of the thirdweb platform, your contract needs to extend `ThirdwebContract`.

From your project, add the thirdweb contracts dependency:

```shell
yarn add @thirdweb-dev/contracts
```

or with npm

```shell
npm i @thirdweb-dev/contracts
```

Once installed, in your Solidity contract you want to publish, import and extend `ThirdwebContract`. Here's an example:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@thirdweb-dev/contracts/ThirdwebContract.sol";

contract HellowWorldContract is ThirdwebContract {
    // your contract code
}
```

## 2. Publishing your contract

Once your contract code is setup like above, you can now publish it by running:

```shell
npx @thirdweb-dev/cli publish
```

Alternatively, you install the CLI as a global command on your machine:

```shell
npm i -g @thirdweb-dev/cli
thirdweb publish
```

This command will:

- auto-detect any contract that extends `ThirdwebContract` in your project
- compile your project
- Upload ABIs to IPFS
- Open the publish flow in your thirdweb dashboard in a browser

From the thirdweb dashboard, you can review and publish your contracts. Published contracts can be deployed via the dashboard on with our SDKs.

---

## Supported projects

To publish, you need to be in a directory that contains a project which the CLI is compatible
with. The projects we support so far:

- hardhat
- forge
- truffle

Coming soon:

- brownie

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
