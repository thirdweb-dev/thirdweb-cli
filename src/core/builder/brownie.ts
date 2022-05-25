import { logger, spinner } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { BaseBuilder } from "./builder-base";
import { execSync } from "child_process";
import { from } from "form-data";
import { existsSync, readFileSync, rmdirSync } from "fs";
import ora from "ora";
import { basename, join } from "path";
import { parse } from "yaml";

export class BrownieBuilder extends BaseBuilder {
  public async compile(options: CompileOptions): Promise<{
    contracts: ContractPayload[];
  }> {
    const config = parse(
      readFileSync(join(options.projectPath, "brownie-config.yaml"), "utf-8"),
    );

    const buildPath = join(
      options.projectPath,
      config?.project_structure?.build || "./build",
    );

    if (options.clean) {
      ora().succeed("Cleaning build directory");
      existsSync(buildPath) && rmdirSync(buildPath, { recursive: true });
    }

    const loader = spinner("Compiling...");
    try {
      execSync("brownie compile");
    } catch (e) {
      loader.fail("Compilation failed");
      throw e;
    }

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
            metadata: {},
            bytecode,
            name: contractName,
          });
          break;
        }
      }
    }

    loader.succeed("Compilation successful");
    return { contracts };
  }
}
