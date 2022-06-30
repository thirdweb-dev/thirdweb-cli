# thirdweb create

The easiest way to get started with thirdweb is by using `thirdweb create`. This CLI tool enables you to quickly start building a new thirdweb application, with everything set up for you. You can create a new app using one the defaults thirdweb templates, or by using one of the [official thirdweb examples](https://github.com/thirdweb-example). To get started, use the following command:

```bash
npx thirdweb@latest create
# or
yarn thirdweb@latest create
# or
pnpm thirdweb@latest create
```

This will prompt you to choose between "Next.js", "Create React App" and "Vite". You can also pass them as a flag:

```bash
npx thirdweb@latest create --next
# or
npx thirdweb@latest create --cra
```

This will also prompt you to choose between TypeScript or JavaScript, you can also pass them as a flag:

```bash
npx thirdweb@latest create --typescript
# or
npx thirdweb@latest create --javascript
```

You can also use the shortcute `--js` or `--ts`.

An example of using both flags at the same time:

```bash
npx thirdweb@latest create --next --ts`
```

One example of using the `--example` flag:

```bash
npx thirdweb@latest create --example custom-minting-page
# or
yarn thirdweb@latest create --example custom-minting-page
# or
pnpm thirdweb@latest create --example custom-minting-page
```

## Options

`thirdweb create` comes with the following options:

- **--ts, --typescript** - Initialize as a TypeScript project.
- **-e, --example [name]** - An example to bootstrap the app with. You can use an example name from the [thirdweb-example organization](https://github.com/thirdweb-example).
- **--use-npm** - Explicitly tell the CLI to bootstrap the app using npm. To bootstrap using yarn we recommend to run `yarn thirdweb@latest create`
- **--use-pnpm** - Explicitly tell the CLI to bootstrap the app using pnpm. To bootstrap using pnpm we recommend running `yarn thirdweb@latest create`

## Why use thirdweb create?

`thirdweb create` allows you to create a new thirdweb app within seconds. It is officially maintained by the creators of thirdweb, and includes a number of benefits:

- **Interactive Experience**: Running `npx thirdweb create` (with no arguments) launches an interactive experience that guides you through setting up a project.
- **Zero Dependencies**: Initializing a project is as quick as one second, thirdweb create has zero dependencies.
- **Support for Examples**: thirdweb create can bootstrap your application using an example from the thirdweb examples collection (e.g. `npx thirdweb create --example contract-hub`).