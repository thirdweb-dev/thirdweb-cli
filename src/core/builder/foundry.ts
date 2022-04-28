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
    execSync("forge build");

    // get the current config first
    const foundryConfig = execSync("forge config --json").toString();

    const actualFoundryConfig = JSON.parse(foundryConfig);

    const outPath = join(options.projectPath, actualFoundryConfig.out);
    // const contractsPath =

    const contracts: ContractPayload[] = [];
    const files: string[] = [];
    this.findFiles(outPath, /^.*(?<!dbg)\.json$/, files);

    for (const file of files) {
      logger.debug("Processing:", file.replace(outPath, ""));
      const contractName = basename(file, ".json");
      const contractJsonFile = readFileSync(file, "utf-8");

      const contractInfo = JSON.parse(contractJsonFile);
      const abi = contractInfo.abi;
      const bytecode = contractInfo.bytecode.object;

      for (const input of abi) {
        if (this.isThirdwebContract(input)) {
          if (contracts.find((c) => c.name === contractName)) {
            logger.error(
              `Found multiple contracts with name "${contractName}". Contract names should be unique.`,
            );
            process.exit(1);
          }
          contracts.push({
            abi,
            bytecode,
            name: contractName,
          });
          break;
        }
      }
    }

    return { contracts };
  }
}
