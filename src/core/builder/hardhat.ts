import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import { basename, join } from "path";
import { logger } from "../helpers/logger";
import { Builder as IBuilder } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import type { HardhatUserConfig } from "hardhat/config";
import deepmerge from "deepmerge";

export class HardhatBuilder implements IBuilder {
  constructor() {}

  public async compile(options: {
    projectPath: string;
    name: string;
  }): Promise<{
    contracts: ContractPayload[];
  }> {
    // TODO this will work for .js but we also need to handle .ts cases
    let hardhatConfig: HardhatUserConfig = {
      paths: {
        artifacts: "./artifacts",
        sources: "./contracts",
      },
    };
    try {
      let readHardHatConfig: HardhatUserConfig;
      try {
        //try to read js config
        readHardHatConfig = require(join(
          options.projectPath,
          "hardhat.config.js"
        )).default;
      } catch (err) {
        //otherwise try to read ts config
        readHardHatConfig = require(join(
          options.projectPath,
          "hardhat.config.ts"
        )).default;
      }

      hardhatConfig = deepmerge(hardhatConfig, readHardHatConfig);
    } catch (err) {
      logger.warn(
        "failed to load project hardhat config, continuing with default options"
      );
    }

    const stdout = execSync(
      `cd ${options.projectPath} && npx hardhat clean && npx hardhat compile`
    );

    logger.debug("stdout from hardhat:", stdout.toString());

    const artifactsPath = join(
      options.projectPath,
      hardhatConfig.paths?.artifacts || "./artifacts"
    );
    const contractsPath = join(
      artifactsPath,
      hardhatConfig.paths?.sources || "./contracts"
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
