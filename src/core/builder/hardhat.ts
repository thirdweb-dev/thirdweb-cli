import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, join } from "path";
import { logger } from "../helpers/logger";
import { Builder as IBuilder } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";

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
    const { default: hre, userConfig } = await import(hardhatPath);

    if (options.clean) {
      logger.info("cleaning before compiling");
      await hre.run("clean");
    }

    try {
      await hre.run("compile");
    } catch (err) {
      logger.error("hardhat failed to compile", err);
      process.exit(1);
    }

    const artifactsPath = join(
      options.projectPath,
      userConfig.paths?.artifacts || "./artifacts"
    );
    const contractsPath = join(
      artifactsPath,
      userConfig.paths?.sources || "./contracts"
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
