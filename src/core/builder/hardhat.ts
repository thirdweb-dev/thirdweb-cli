import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { basename, join } from "path";
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
    let hardhatPath: string | undefined;
    try {
      hardhatPath = require.resolve("hardhat");
    } catch (e) {
      logger.error(
        "failed to load hardhat runtime, please install hardhat: npm i -g hardhat"
      );
      process.exit(1);
    }
    logger.debug("Hardhat path found", hardhatPath);
    let hre: HardhatRuntimeEnvironment | undefined;
    try {
      hre = require(hardhatPath);
      logger.debug("userconfig paths", hre?.userConfig.paths);

      if (options.clean) {
        logger.info("Cleaning before compiling");
        await hre?.run("clean");
      }

      try {
        logger.info("Compiling project...");
        await hre?.run("compile");
      } catch (err) {
        logger.error("hardhat failed to compile", err);
        process.exit(1);
      }
    } catch (e) {
      logger.warn(
        "failed to load hardhat runtime: hardhat.config files with ESM style imports are not suppoerted. Consider switching to CJS style requires."
      );
      logger.info("Falling back to default hardhat config.");
      // Fallback to npx when we can't load hardhat
      logger.info("Compiling project...");
      execSync("npx hardhat compile");
    }

    const artifactsPath = join(
      options.projectPath,
      hre?.userConfig.paths?.artifacts || "./artifacts"
    );
    const contractsPath = join(
      artifactsPath,
      hre?.userConfig.paths?.sources || "./contracts"
    );

    const contracts: ContractPayload[] = [];
    const files: string[] = [];
    this.findFiles(contractsPath, /.*[^\.dbg]\.json$/, files);

    for (const file of files) {
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
