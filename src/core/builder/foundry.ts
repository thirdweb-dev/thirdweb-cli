import { logger } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { BaseBuilder } from "./builder-base";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { basename, join } from "path";

export class FoundryBuilder extends BaseBuilder {
  public async compile(options: CompileOptions): Promise<{
    contracts: ContractPayload[];
  }> {
    if (options.clean) {
      logger.info("Running forge clean");
      execSync("forge clean");
    }

    logger.info("Compiling...");
    execSync("forge build --extra-output-files metadata");

    // get the current config first
    const foundryConfig = execSync("forge config --json").toString();

    const actualFoundryConfig = JSON.parse(foundryConfig);

    const outPath = join(options.projectPath, actualFoundryConfig.out);

    const contracts: ContractPayload[] = [];
    const files: string[] = [];
    this.findFiles(outPath, /^.*(?<!metadata)\.json$/, files);
    const metadataFiles: string[] = [];
    this.findFiles(outPath, /^.*metadata\.json$/, metadataFiles);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const contractName = basename(file, ".json");
      const contractJsonFile = readFileSync(file, "utf-8");

      const contractInfo = JSON.parse(contractJsonFile);
      const abi = contractInfo.abi;
      const bytecode = contractInfo.bytecode.object;
      if (this.shouldProcessContract(bytecode, contractName)) {
        contracts.push({
          name: contractName,
          metadata: metadataFiles[i],
          bytecode,
        });
      }
    }

    return { contracts };
  }
}
