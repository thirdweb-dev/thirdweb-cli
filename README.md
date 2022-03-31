# `thirdweb-cli`

The thirdweb CLI is your one-stop-shop for publishing custom contracts for the world
to use. The CLI uploads all necessary data to decentralized storage and makes it available
to deploy via the thirdweb sdk or thirdweb dashboard.

The project thats uploaded uses a standard public format that allows _your team_ to
compile the projects, too.

## Installation

```bash
$ yarn global add @thirdweb-dev/cli
$ npm i -g @thirdweb-dev/cli # or node
```

## Publishing the example contract

Clone the repo and run this command after installing the CLI tool:

```bash
$ thirdweb publish greeter --path examples/hardhat/contracts/Greeter.sol
```

## Local Development

The simplest way to work on the CLI locally is to:

1. Install the package locally
2. Run the `build:watch` command to compile any changes in realtime

```bash
$ npm global add ./
$ yarn run build:watch
```

> TODO: figure out how to do the global local installation with yarn
