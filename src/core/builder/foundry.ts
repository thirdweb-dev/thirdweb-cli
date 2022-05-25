import { extractIPFSHashFromBytecode, getIPFSHash } from "../helpers/ipfs";
import { logger, spinner } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { IpfsStorage } from "../storage/ipfs-storage";
import { BaseBuilder } from "./builder-base";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { basename, join } from "path";

export class FoundryBuilder extends BaseBuilder {
  public async compile(options: CompileOptions): Promise<{
    contracts: ContractPayload[];
  }> {
    const loader = spinner("Compiling...");
    try {
      execSync("forge clean");
      execSync("forge build --extra-output metadata");
    } catch (e) {
      loader.fail("Compilation failed");
      throw e;
    }

    // get the current config first
    const foundryConfig = execSync("forge config --json").toString();

    const actualFoundryConfig = JSON.parse(foundryConfig);

    const outPath = join(options.projectPath, actualFoundryConfig.out);

    const contracts: ContractPayload[] = [];
    const files: string[] = [];
    this.findFiles(outPath, /^.*(?<!metadata)\.json$/, files);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const contractName = basename(file, ".json");
      const contractJsonFile = readFileSync(file, "utf-8");

      const contractInfo = JSON.parse(contractJsonFile);
      const bytecode = contractInfo.bytecode.object;

      const metadata = JSON.stringify(contractInfo.metadata);

      if (this.shouldProcessContract(bytecode, contractName)) {
        contracts.push({
          name: contractName,
          metadata,
          bytecode,
        });
      }
    }
    loader.succeed("Compilation successful");
    return { contracts };
  }
}
