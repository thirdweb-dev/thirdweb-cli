import { logger, spinner } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { BaseBuilder } from "./builder-base";
import { execSync } from "child_process";
import { existsSync, readFileSync, rmSync } from "fs";
import { join } from "path";

export class TruffleBuilder extends BaseBuilder {
  public async compile(options: CompileOptions): Promise<{
    contracts: ContractPayload[];
  }> {
    // get the current config first
    const truffleConfig = require(join(
      options.projectPath,
      "truffle-config.js",
    ));

    const buildPath = join(
      options.projectPath,
      truffleConfig.contracts_build_directory || "./build/contracts",
    );

    const loader = spinner("Compiling...");
    try {
      existsSync(buildPath) && rmSync(buildPath, { recursive: true });
      execSync("npx truffle compile");
    } catch (e) {
      loader.fail("Compilation failed");
      throw e;
    }

    const contracts: ContractPayload[] = [];
    const files: string[] = [];
    this.findFiles(buildPath, /^.*(?<!dbg)\.json$/, files);

    for (const file of files) {
      logger.debug("Processing:", file.replace(buildPath, ""));
      const contractJsonFile = readFileSync(file, "utf-8");
      const contractInfo = JSON.parse(contractJsonFile);
      const contractName = contractInfo.contractName;
      const metadata = contractInfo.metadata;
      const abi = metadata.output.abi;
      const bytecode = contractInfo.bytecode;

      if (this.shouldProcessContract(abi, bytecode, contractName)) {
        contracts.push({
          metadata,
          bytecode,
          name: contractName,
        });
      }
    }
    loader.succeed("Compilation successful");
    return { contracts };
  }
}
