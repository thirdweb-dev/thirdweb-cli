import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { HardhatConfig } from "hardhat/types";
import { basename, join, resolve } from "path";
import { logger } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { execSync } from "child_process";
import { BaseBuilder } from "./builder-base";

export class HardhatBuilder extends BaseBuilder {
  public async compile(options: CompileOptions): Promise<{
    contracts: ContractPayload[];
  }> {
    if (options.clean) {
      logger.info("Running hardhat clean");
      execSync("npx hardhat clean");
    }

    logger.info("Compiling...");
    execSync("npx hardhat compile");
    //we get our very own extractor script from the dir that we're in during execution
    // this is `./dist/cli` (for all purposes of the CLI)
    // then we look up the hardhat config extractor file path from there
    const configExtractorScriptPath = resolve(
      __dirname,
      "../helpers/hardhat-config-extractor.js"
    );

    //the hardhat extractor **logs out** the runtime config of hardhat, we take that stdout and parse it
    const stringifiedConfig = execSync(
      `npx hardhat run ${configExtractorScriptPath} --no-compile`
    ).toString();
    //voila the hardhat config
    const actualHardhatConfig = JSON.parse(stringifiedConfig) as HardhatConfig;

    logger.debug(
      "successfully extracted hardhat config",
      actualHardhatConfig.paths
    );

    const artifactsPath = actualHardhatConfig.paths.artifacts;
    const sourcesDir = actualHardhatConfig.paths.sources.replace(
      options.projectPath,
      ""
    );
    const contractsPath = join(artifactsPath, sourcesDir);

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
              `Found multiple contracts with name "${contractName}". Contract names should be unique.`
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

    logger.info(
      "Detected thirdweb contracts:",
      contracts.map((c) => c.name).join(", ")
    );

    return {
      contracts,
    };
  }
}
