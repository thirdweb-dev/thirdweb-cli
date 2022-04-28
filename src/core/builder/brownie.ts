import { logger } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { BaseBuilder } from "./builder-base";
import { execSync } from "child_process";
import { cosmiconfigSync } from "cosmiconfig";
import { existsSync, readFileSync, rmdirSync } from "fs";
import { basename, join } from "path";

export class BrownieBuilder extends BaseBuilder {
  public async compile(options: CompileOptions): Promise<{
    contracts: ContractPayload[];
  }> {
    const explorer = cosmiconfigSync("brownie");

    const loadedConfig = explorer.load(
      join(options.projectPath, "brownie-config.yaml"),
    );

    const buildPath = join(
      options.projectPath,
      loadedConfig?.config?.project_structure?.build || "./build",
    );

    if (options.clean) {
      logger.info("Cleaning build directory");
      existsSync(buildPath) && rmdirSync(buildPath, { recursive: true });
    }

    logger.info("Compiling...");
    execSync("brownie compile");

    const contractsPath = join(buildPath, "contracts/");

    const contracts: ContractPayload[] = [];
    const files: string[] = [];
    this.findFiles(contractsPath, /^.*(?<!dbg)\.json$/, files);

    for (const file of files) {
      logger.debug("Processing:", file.replace(contractsPath, ""));
      const contractName = basename(file, ".json");
      const contractJsonFile = readFileSync(file, "utf-8");

      const contractInfo = JSON.parse(contractJsonFile);
      const abi = contractInfo.abi;
      const bytecode = contractInfo.bytecode;

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
