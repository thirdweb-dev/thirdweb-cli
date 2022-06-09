import { execute } from "../helpers/exec";
import { logger } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { BaseBuilder } from "./builder-base";
import { readFileSync } from "fs";
import { basename, join } from "path";

export class FoundryBuilder extends BaseBuilder {
  public async compile(options: CompileOptions): Promise<{
    contracts: ContractPayload[];
  }> {
    await execute("forge clean");
    await execute("forge build --extra-output metadata");

    // get the current config first
    const foundryConfig = (await execute("forge config --json")).stdout;

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

      if (
        !contractInfo.bytecode ||
        !contractInfo.deployedBytecode ||
        !contractInfo.metadata
      ) {
        logger.debug("Skipping", contractName, "(no bytecode or metadata)");
        continue;
      }

      const target = contractInfo.metadata.settings.compilationTarget;
      if (
        Object.keys(target).length === 0 ||
        Object.keys(target)[0].includes("@")
      ) {
        // skip library contracts
        logger.debug("Skipping", contractName, "(not a source target)");
        continue;
      }

      const bytecode = contractInfo.bytecode.object;
      const deployedBytecode = contractInfo.deployedBytecode.object;

      // Grab the raw metadata
      const rawMeta = contractInfo.metadata;
      rawMeta.output.abi = contractInfo.abi;
      // need to re-add libraries if not present since forge stripts it out
      if (!rawMeta.settings.libraries) {
        rawMeta.settings.libraries = {};
      }
      // delete `outputSelection` from the metadata which has nothing to do here, bug in forge
      delete rawMeta.settings.outputSelection;
      // sort the metadata ALPHABETICALLY, since forge shuffles the keys in their parsing
      const meta: any = this.sort(rawMeta);
      // finally, here's the actual solc output that we expect
      const metadata = JSON.stringify(meta);

      const sources = Object.keys(meta.sources);

      if (
        this.shouldProcessContract(
          contractInfo.abi,
          deployedBytecode,
          contractName,
        )
      ) {
        contracts.push({
          name: contractName,
          metadata,
          bytecode,
          sources,
        });
      }
    }
    return { contracts };
  }

  private sort(object: any) {
    if (typeof object != "object" || object instanceof Array)
      // Not to sort the array
      return object;
    var keys = Object.keys(object);
    keys.sort();
    var newObject: any = {};
    for (var i = 0; i < keys.length; i++) {
      newObject[keys[i]] = this.sort(object[keys[i]]);
    }
    return newObject;
  }
}
