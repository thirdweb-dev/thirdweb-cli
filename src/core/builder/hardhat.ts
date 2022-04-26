import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { HardhatConfig } from "hardhat/types";
import { basename, join, resolve } from "path";
import { logger } from "../helpers/logger";
import { Builder as IBuilder } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { execSync } from "child_process";

export class HardhatBuilder implements IBuilder {
  constructor() {}

  public async compile(options: {
    projectPath: string;
    name: string;
    clean: boolean;
  }): Promise<{
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
    const contractsPath = join(artifactsPath, "./contracts");

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

  private isThirdwebContract(input: any): boolean {
    try {
      return (
        input.name === "setThirdwebInfo" &&
        input.inputs[0].internalType === "struct ThirdwebContract.ThirdwebInfo"
      );
    } catch (e) {
      return false;
    }
  }

  private findFiles(startPath: string, filter: RegExp, results: string[]) {
    if (!existsSync(startPath)) {
      console.log("no dir ", startPath);
      return;
    }

    var files = readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
      var filename = join(startPath, files[i]);
      var stat = statSync(filename);
      if (stat.isDirectory()) {
        this.findFiles(filename, filter, results);
      } else if (filter.test(filename)) results.push(filename);
    }
  }
}
