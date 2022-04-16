#!/usr/bin/env node

import { IpfsStorage } from "./../core/storage/ipfs-storage";
import { Command } from "commander";
import path from "path";
import { Logger } from "tslog";
import detect from "../core/detection/detect";
import build from "../core/builder/build";
import { THIRDWEB_URL } from "../constants/urls";
import { URL } from "url";
import open from "open";
import { Contract } from "../core/interfaces/Contract";
import { logger } from "../core/helpers/logger";

const main = async () => {
  const program = new Command();

  // TODO: allow overriding the default storage
  const storage = new IpfsStorage();

  const cliVersion = require("../../package.json").version;

  console.info(`
  
  $$\\     $$\\       $$\\                 $$\\                         $$\\       
  $$ |    $$ |      \\__|                $$ |                        $$ |      
$$$$$$\\   $$$$$$$\\  $$\\  $$$$$$\\   $$$$$$$ |$$\\  $$\\  $$\\  $$$$$$\\  $$$$$$$\\  
\\_$$  _|  $$  __$$\\ $$ |$$  __$$\\ $$  __$$ |$$ | $$ | $$ |$$  __$$\\ $$  __$$\\ 
  $$ |    $$ |  $$ |$$ |$$ |  \\__|$$ /  $$ |$$ | $$ | $$ |$$$$$$$$ |$$ |  $$ |
  $$ |$$\\ $$ |  $$ |$$ |$$ |      $$ |  $$ |$$ | $$ | $$ |$$   ____|$$ |  $$ |
  \\$$$$  |$$ |  $$ |$$ |$$ |      \\$$$$$$$ |\\$$$$$\\$$$$  |\\$$$$$$$\\ $$$$$$$  |
   \\____/ \\__|  \\__|\\__|\\__|       \\_______| \\_____\\____/  \\_______|\\_______/ 
                                                                              
  `);
  console.info("version:", cliVersion);
  console.info("\n\n");

  program
    .name("thirdweb-cli")
    .description("Official thirdweb command line interface")
    .version(cliVersion);

  program
    .command("publish")
    .description("Bundles & publishes a project to IPFS")
    .option("-p, --path <project-path>", "path to project", ".")
    .action(async (options) => {
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

      const compiledResult = await build(projectPath, projectType);

      if (compiledResult.contracts.length == 0) {
        logger.error(
          "No thirdweb contract detected. Extend ThirdwebContract to publish your own contracts."
        );
        process.exit(1);
      }

      logger.info("Project compiled successfully");

      const hashes = await Promise.all(
        compiledResult.contracts.map(async (c) => {
          const bytecodeHash = await storage.upload(c.bytecode);
          const stringifiedAbi = JSON.stringify(c.abi);
          const abiHash = await storage.upload(stringifiedAbi);

          const hash = await storage.upload(
            JSON.stringify({
              name: c.name,
              bytecodeUri: bytecodeHash,
              abiUri: abiHash,
            } as Contract)
          );
          logger.debug(`Uploaded ${c.name} publish metadata to ${hash}`);
          return hash;
        })
      );

      const url = new URL(THIRDWEB_URL + "/dashboard/publish");

      for (let hash of hashes) {
        url.searchParams.append("uri", hash);
      }

      logger.info(`Go to this link to publish to the registry: ${url}`);

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
