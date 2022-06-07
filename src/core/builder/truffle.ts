import { execute } from "../helpers/exec";
import { logger, spinner } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { BaseBuilder } from "./builder-base";
import { existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";

export class TruffleBuilder extends BaseBuilder {
  public async compile(options: CompileOptions): Promise<{
    contracts: ContractPayload[];
  }> {
    // get the current config first
    const truffleConfig = require(join(
      options.projectPath,
      "truffle-config.js",
    ));

    const buildPath = join(
      options.projectPath,
      truffleConfig.contracts_build_directory || "./build/contracts",
    );

    existsSync(buildPath) && rmSync(buildPath, { recursive: true });
    await execute("npx --yes truffle compile");

    const contracts: ContractPayload[] = [];
    const files: string[] = [];
    this.findFiles(buildPath, /^.*(?<!dbg)\.json$/, files);

    for (const file of files) {
      logger.debug("Processing:", file.replace(buildPath, ""));
      const contractJsonFile = readFileSync(file, "utf-8");
      const contractInfo = JSON.parse(contractJsonFile);
      const contractName = contractInfo.contractName;
      const metadata = contractInfo.metadata;
      const bytecode = contractInfo.bytecode;
      const deployedBytecode = contractInfo.deployedBytecode;
      const parsedMetadata = JSON.parse(metadata);
      const abi = parsedMetadata.output.abi;

      const target = parsedMetadata.settings.compilationTarget;
      if (
        Object.keys(target).length === 0 ||
        Object.keys(target)[0].includes("@")
      ) {
        // skip library contracts
        logger.debug("Skipping", contractName, "(not a source target)");
        continue;
      }

      if (this.shouldProcessContract(abi, deployedBytecode, contractName)) {
        contracts.push({
          metadata,
          bytecode,
          name: contractName,
        });
      }
    }
    return { contracts };
  }
}
