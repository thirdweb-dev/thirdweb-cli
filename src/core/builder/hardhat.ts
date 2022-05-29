import { logger, spinner } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { BaseBuilder } from "./builder-base";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { HardhatConfig } from "hardhat/types";
import { join, resolve } from "path";

export class HardhatBuilder extends BaseBuilder {
  public async compile(options: CompileOptions): Promise<{
    contracts: ContractPayload[];
  }> {
    const loader = spinner("Compiling...");
    try {
      execSync("npx hardhat clean");
      execSync("npx hardhat compile");
    } catch (e) {
      loader.fail("Compilation failed");
      throw e;
    }
    //we get our very own extractor script from the dir that we're in during execution
    // this is `./dist/cli` (for all purposes of the CLI)
    // then we look up the hardhat config extractor file path from there
    const configExtractorScriptPath = resolve(
      __dirname,
      "../helpers/hardhat-config-extractor.js",
    );

    //the hardhat extractor **logs out** the runtime config of hardhat, we take that stdout and parse it
    const stringifiedConfig = execSync(
      `npx hardhat run ${configExtractorScriptPath} --no-compile`,
    ).toString();
    //voila the hardhat config

    const actualHardhatConfig = JSON.parse(
      stringifiedConfig.split("__tw__")[1],
    ) as HardhatConfig;

    logger.debug(
      "successfully extracted hardhat config",
      actualHardhatConfig.paths,
    );

    const artifactsPath = actualHardhatConfig.paths.artifacts;
    const sourcesDir = actualHardhatConfig.paths.sources.replace(
      options.projectPath,
      "",
    );
    const contractsPath = join(artifactsPath, sourcesDir);

    const contracts: ContractPayload[] = [];
    const files: string[] = [];
    this.findFiles(contractsPath, /^.*(?<!dbg)\.json$/, files);

    const buildOutputPath = join(artifactsPath, "build-info");
    const buildFiles: string[] = [];
    this.findFiles(buildOutputPath, /^.*(?<!dbg)\.json$/, buildFiles);

    // TODO this only grabs the first build file, might be more to process?
    const buildJsonFile = readFileSync(buildFiles[0], "utf-8");
    const buildJson = JSON.parse(buildJsonFile);

    const contractBuildOutputs = buildJson.output.contracts;

    for (const [contractPath, contractInfos] of Object.entries(
      contractBuildOutputs,
    )) {
      // TODO this fragile logic to only process contracts that are in the sources dir
      if (!contractPath.startsWith(sourcesDir.replace("/", ""))) {
        logger.debug("Skipping", contractPath, "(not part of sources)");
        continue;
      }
      for (const [contractName, contractInfo] of Object.entries(
        contractInfos as any,
      )) {
        const info = contractInfo as any;

        if (
          !info.evm ||
          !info.evm.bytecode ||
          !info.evm.bytecode.object ||
          !info.metadata
        ) {
          logger.debug("Skipping", contractPath, "(no bytecode or metadata)");
          continue;
        }

        const bytecode = info.evm.bytecode.object;
        const deployedBytecode = info.evm.deployedBytecode.object;
        const metadata = info.metadata;

        if (this.shouldProcessContract(deployedBytecode, contractName)) {
          contracts.push({
            metadata,
            bytecode,
            name: contractName,
          });
        }
      }
    }
    loader.succeed("Compilation successful");
    return {
      contracts,
    };
  }
}
