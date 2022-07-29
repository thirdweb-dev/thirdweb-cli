import { PackageManager } from "./get-pkg-manager";
import { downloadAndExtractRepo, hasTemplate } from "./templates";
import chalk from "chalk";
import path from "path";
import { isWriteable } from "./is-writeable";
import { makeDir } from "./make-dir";
import { isFolderEmpty } from "./is-folder-empty";
import { getOnline } from "./is-online";
import { install } from "./install";
import { DownloadError } from "./create-app";
import retry from "async-retry";
import { tryGitInit } from "./git";

interface ICreateContract {
  contractPath: string;
  packageManager: PackageManager;
  language?: string;
  template?: string;
}

export async function createContract({
  contractPath,
  packageManager,
  language,
  template,
}: ICreateContract) {
  if (template) {
    const found = await hasTemplate(template);

    if (!found) {
      console.error(
        `Could not locate the repository for ${chalk.red(
          `"${template}"`,
        )}. Please check that the repository exists and try again.`,
      );
      process.exit(1);
    }
  }

  const root = path.resolve(contractPath);

  if (!(await isWriteable(path.dirname(root)))) {
    console.error(
      "The application path is not writable, please check folder permissions and try again.",
    );
    console.error(
      "It is likely you do not have write permissions for this folder.",
    );
    process.exit(1);
  }

  const projectName = path.basename(root);

  await makeDir(root);
  if (!isFolderEmpty(root, projectName)) {
    process.exit(1);
  }

  const useYarn = packageManager === "yarn";
  const isOnline = !useYarn || (await getOnline());
  const originalDirectory = process.cwd();

  console.log(`Creating a new thirdweb contracts project in ${chalk.green(root)}.`);
  console.log();

  process.chdir(root);

  function isErrorLike(err: unknown): err is { message: string; } {
    return (
      typeof err === "object" &&
      err !== null &&
      typeof (err as { message?: unknown; }).message === "string"
    );
  }

  if (template) {
    /**
     * If a template repository is provided, clone it.
     */
    try {
      console.log(
        `Downloading files from repo ${chalk.cyan(
          template,
        )}. This might take a moment.`,
      );
      console.log();
      await retry(
        () => downloadAndExtractRepo(root, { name: template, filePath: "" }),
        {
          retries: 3,
        },
      );
    } catch (reason) {
      throw new DownloadError(
        isErrorLike(reason) ? reason.message : reason + "",
      );
    }
  } else {
    try {
      console.log(
        `Downloading files. This might take a moment.`,
      );

      const starter = `hardhat-${language}-starter`;
      await retry(
        () =>
          downloadAndExtractRepo(root, { name: starter, filePath: "" }),
        {
          retries: 3,
        },
      );
    } catch (reason) {
      throw new DownloadError(
        isErrorLike(reason) ? reason.message : reason + "",
      );
    }
  }

  console.log("Installing packages. This might take a couple of minutes.");
  console.log();

  await install(root, null, { packageManager, isOnline });
  console.log();

  if (tryGitInit(root)) {
    console.log("Initialized a git repository.");
    console.log();
  }

  let cdpath: string;
  if (path.join(originalDirectory, projectName) === contractPath) {
    cdpath = projectName;
  } else {
    cdpath = contractPath;
  }


  console.log(`${chalk.green("Success!")} Created ${projectName} at ${contractPath}`);
  console.log("Inside that directory, you can run several commands:");
  console.log();
  console.log(
    chalk.cyan(
      `  ${packageManager} ${useYarn ? "" : "run"} deploy`,
    ),
  );
  console.log("    Deploys your contracts with the thirdweb deploy flow.");
  console.log();
  console.log(
    chalk.cyan(
      `  ${packageManager} ${useYarn ? "" : "run"} release`,
    ),
  );
  console.log("    Releases your contracts with the thirdweb release flow..");
  console.log();
  console.log("We suggest that you begin by typing:");
  console.log();
  console.log(chalk.cyan("  cd"), cdpath);
  console.log();
}
