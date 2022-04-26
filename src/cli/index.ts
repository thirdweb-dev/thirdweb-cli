#!/usr/bin/env node

import { IpfsStorage } from "./../core/storage/ipfs-storage";
import { Command } from "commander";
import path from "path";
import detect from "../core/detection/detect";
import build from "../core/builder/build";
import { THIRDWEB_URL } from "../constants/urls";
import { URL } from "url";
import open from "open";
import { Contract } from "../core/interfaces/Contract";
import { logger } from "../core/helpers/logger";
import updateNotifier from "update-notifier";

const main = async () => {
  const program = new Command();

  // TODO: allow overriding the default storage
  const storage = new IpfsStorage();

  const pkg = require("../../package.json");

  const cliVersion = pkg.version;

  //yes this has to look like this, eliminates whitespace
  console.info(`  $$\\     $$\\       $$\\                 $$\\                         $$\\       
  $$ |    $$ |      \\__|                $$ |                        $$ |      
$$$$$$\\   $$$$$$$\\  $$\\  $$$$$$\\   $$$$$$$ |$$\\  $$\\  $$\\  $$$$$$\\  $$$$$$$\\  
\\_$$  _|  $$  __$$\\ $$ |$$  __$$\\ $$  __$$ |$$ | $$ | $$ |$$  __$$\\ $$  __$$\\ 
  $$ |    $$ |  $$ |$$ |$$ |  \\__|$$ /  $$ |$$ | $$ | $$ |$$$$$$$$ |$$ |  $$ |
  $$ |$$\\ $$ |  $$ |$$ |$$ |      $$ |  $$ |$$ | $$ | $$ |$$   ____|$$ |  $$ |
  \\$$$$  |$$ |  $$ |$$ |$$ |      \\$$$$$$$ |\\$$$$$\\$$$$  |\\$$$$$$$\\ $$$$$$$  |
   \\____/ \\__|  \\__|\\__|\\__|       \\_______| \\_____\\____/  \\_______|\\_______/ `);
  console.info(`\n 💎 thirdweb-cli v${cliVersion} 💎\n`);
  updateNotifier({
    pkg,
    shouldNotifyInNpmScript: true,
    //check every time while we're still building the CLI
    updateCheckInterval: 0,
  }).notify();

  program
    .name("thirdweb-cli")
    .description("Official thirdweb command line interface")
    .version(cliVersion);

  program
    .command("publish")
    .description("Bundles & publishes a project to IPFS")
    .option("-p, --path <project-path>", "path to project", ".")
    .option("-d, --dry-run", "dry run (skip actually publishing)")
    .option("-c, --clean", "clean artifacts before compiling")
    .option("-v, --verbose", "show debug logs")
    .action(async (options) => {
      logger.setSettings({
        minLevel: options.verbose ? "debug" : "info",
      });

      let projectPath = process.cwd();
      if (options.path) {
        logger.debug("Overriding project path to " + options.path);

        const resolvedPath = (options.path as string).startsWith("/")
          ? options.path
          : path.resolve(`${projectPath}/${options.path}`);
        projectPath = resolvedPath;
      }

      logger.debug("Publishing project at path " + projectPath);

      const projectType = await detect(projectPath);
      if (projectType === "unknown") {
        logger.error("Unable to detect project type");
        return;
      }
      logger.info("Detected project type:", projectType);

      const compiledResult = await build(
        projectPath,
        projectType,
        options.clean
      );

      if (compiledResult.contracts.length == 0) {
        logger.error(
          "No thirdweb contract detected. Extend ThirdwebContract to publish your own contracts."
        );
        process.exit(1);
      }

      logger.info("Project compiled successfully");

      if (options.dryRun) {
        logger.info("Dry run, skipping publish");
        return;
      }

      logger.info("Uploading contract data...");
      const bytecodes = compiledResult.contracts.map((c) => c.bytecode);
      const abis = compiledResult.contracts.map((c) => JSON.stringify(c.abi));

      const { metadataUris: bytecodeURIs } = await storage.uploadBatch(
        bytecodes
      );
      const { metadataUris: abiURIs } = await storage.uploadBatch(abis);

      const contractMetadatas: string[] = [];
      for (let i = 0; i < compiledResult.contracts.length; i++) {
        const bytecode = bytecodeURIs[i];
        const abi = abiURIs[i];
        const name = compiledResult.contracts[i].name;
        contractMetadatas.push(
          JSON.stringify({
            name: name,
            bytecodeUri: bytecode,
            abiUri: abi,
          } as Contract)
        );
      }
      const { metadataUris: hashes } = await storage.uploadBatch(
        contractMetadatas
      );

      logger.info("Upload successful");

      const url = new URL(THIRDWEB_URL + "/contracts/publish");

      for (let hash of hashes) {
        url.searchParams.append("ipfs", hash.replace("ipfs://", ""));
      }

      logger.info(`Go to this link to publish your contacts:\n\n${url}`);

      open(url.toString());
    });

  await program.parseAsync();
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    logger.error(err);
    process.exit(1);
  });
