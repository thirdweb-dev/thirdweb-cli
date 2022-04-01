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

const logger = new Logger({
  name: "thirdweb-cli",
});

const main = async () => {
  const program = new Command();

  // TODO: allow overriding the default storage
  const storage = new IpfsStorage();

  program
    .name("thirdweb-cli")
    .description("Official thirdweb command line interface")
    .version("0.0.1");

  program
    .command("publish")
    .description("Bundles & publishes a project to IPFS")
    .option("-p, --path <project-path>", "path to project", ".")
    .action(async (options) => {
      let projectPath = process.cwd();
      if (options.path) {
        logger.info("Overriding project path to " + options.path);

        const resolvedPath = (options.path as string).startsWith("/")
          ? options.path
          : path.resolve(`${projectPath}/${options.path}`);
        projectPath = resolvedPath;
      }

      logger.info("Publishing project at path " + projectPath);

      const projectType = await detect(projectPath);
      if (projectType === "unknown") {
        logger.error("Unable to detect project type");
        return;
      }
      logger.info("Detected project type " + projectType);

      const compiledResult = await build(projectPath, projectType);
      logger.info("Project compiled successfully");

      const hashes = await Promise.all(
        compiledResult.contracts.map(async (c) => {
          const bytecodeHash = await storage.upload(c.bytecode);
          const abiHash = await storage.upload(JSON.stringify(c.abi));

          return await storage.upload(
            JSON.stringify({
              name: c.name,
              bytecodeUri: bytecodeHash,
              abiUri: abiHash,
            } as Contract)
          );
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
