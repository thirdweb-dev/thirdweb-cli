/* eslint-disable import/no-extraneous-dependencies */
import retry from "async-retry";
import chalk from "chalk";
import cpy from "cpy";
import fs from "fs";
import os from "os";
import path from "path";
import { downloadAndExtractRepo, hasExample } from "../helpers/examples";
import { makeDir } from "../helpers/make-dir";
import { tryGitInit } from "../helpers/git";
import { install } from "../helpers/install";
import { isFolderEmpty } from "../helpers/is-folder-empty";
import { getOnline } from "../helpers/is-online";
// import { isWriteable } from "./helpers/is-writeable";
import type { PackageManager } from "../helpers/get-pkg-manager";
import {isWriteable} from "../helpers/is-writeable";
import { getStartOrDev } from "../helpers/get-start-or-dev";

export class DownloadError extends Error {}

export async function createApp({
  appPath,
  packageManager,
  framework,
  language,
  example,
}: {
  appPath: string;
  packageManager: PackageManager;
  framework?: string;
  language?: string;
  example?: string;
}): Promise<void> {
  let frameworkPath = "";

  if (example) {
    const found = await hasExample(example);

    if (!found) {
      console.error(
        `Could not locate the repository for ${chalk.red(
          `"${example}"`,
        )}. Please check that the repository exists and try again.`,
      );
      process.exit(1);
    }
  } else if (framework) {
    frameworkPath = `${framework}-${language || "javascript"}-starter`;
    const found = await hasExample(frameworkPath);

    if (!found) {
      console.error(
        `Something went wrong with the ${chalk.red(
          `"${framework}"`,
        )} framework. Please try again.`,
      );
      process.exit(1);
    }
  }

  const root = path.resolve(appPath);

  if (!(await isWriteable(path.dirname(root)))) {
    console.error(
      "The application path is not writable, please check folder permissions and try again.",
    );
    console.error(
      "It is likely you do not have write permissions for this folder.",
    );
    process.exit(1);
  }

  const appName = path.basename(root);

  await makeDir(root);
  if (!isFolderEmpty(root, appName)) {
    process.exit(1);
  }

  const useYarn = packageManager === "yarn";
  const isOnline = !useYarn || (await getOnline());
  const originalDirectory = process.cwd();

  console.log(`Creating a new thirdweb app in ${chalk.green(root)}.`);
  console.log();

  process.chdir(root);

  function isErrorLike(err: unknown): err is { message: string } {
    return (
        typeof err === "object" &&
        err !== null &&
        typeof (err as { message?: unknown }).message === "string"
    );
  }

  if (example) {
    /**
     * If an example repository is provided, clone it.
     */
    try {
      console.log(
        `Downloading files from repo ${chalk.cyan(
          example,
        )}. This might take a moment.`,
      );
      console.log();
      await retry(
        () => downloadAndExtractRepo(root, { name: example, filePath: "" }),
        {
          retries: 3,
        },
      );
    } catch (reason) {
      throw new DownloadError(
        isErrorLike(reason) ? reason.message : reason + "",
      );
    }

    console.log("Installing packages. This might take a couple of minutes.");
    console.log();

    await install(root, null, { packageManager, isOnline });
    console.log();
  } else if (framework) {
    /**
     * If a framework is provided, clone it.
     */
    try {
      console.log(
        `Downloading files with framework ${chalk.cyan(
          framework,
        )}. This might take a moment.`,
      );
      await retry(
        () =>
          downloadAndExtractRepo(root, { name: frameworkPath, filePath: "" }),
        {
          retries: 3,
        },
      );
    } catch (reason) {
      throw new DownloadError(
        isErrorLike(reason) ? reason.message : reason + "",
      );
    }

    console.log("Installing packages. This might take a couple of minutes.");
    console.log();

    await install(root, null, { packageManager, isOnline });
    console.log();
  }

  if (tryGitInit(root)) {
    console.log("Initialized a git repository.");
    console.log();
  }

  let cdpath: string;
  if (path.join(originalDirectory, appName) === appPath) {
    cdpath = appName;
  } else {
    cdpath = appPath;
  }

  let startOrDev = "start";
  if (framework && (framework === "next" || framework === "vite")) {
    startOrDev = "dev";
  } else if (example) {
    startOrDev = await getStartOrDev(example);
  }

  console.log(`${chalk.green("Success!")} Created ${appName} at ${appPath}`);
  console.log("Inside that directory, you can run several commands:");
  console.log();
  console.log(
    chalk.cyan(
      `  ${packageManager} ${
        useYarn || startOrDev === "start" ? "" : "run "
      }${startOrDev}`,
    ),
  );
  console.log("    Starts the development server.");
  console.log();
  console.log(
    chalk.cyan(
      `  ${packageManager} ${
        useYarn || startOrDev === "start" ? "" : "run "
      }build`,
    ),
  );
  console.log("    Builds the app for production.");
  console.log();
  console.log("We suggest that you begin by typing:");
  console.log();
  console.log(chalk.cyan("  cd"), cdpath);
  console.log(
    `  ${chalk.cyan(
      `${packageManager} ${
        useYarn || startOrDev === "start" ? "" : "run "
      }${startOrDev}`,
    )}`,
  );
  console.log();
}
