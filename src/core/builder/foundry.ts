import { extractIPFSHashFromBytecode, getIPFSHash } from "../helpers/ipfs";
import { spinner } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
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

    // const f = JSON.parse(readFileSync("contract.json", "utf-8"));
    // const metadata = JSON.stringify(JSON.stringify(f.metadata));
    // // console.log(metadata);
    // console.log("computed", await getIPFSHash(metadata));
    // console.log(
    //   "xtracted",
    //   extractIPFSHashFromBytecode(
    //     "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052600080fdfea2646970667358221220e6b1956aead7d0e30ea5b730b3708ae2d35ec4fdcb551ee5e2cfb9331106852b64736f6c634300080d0033",
    //   ),
    // );
    // console.log("----------");

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const contractName = basename(file, ".json");
      const contractJsonFile = readFileSync(file, "utf-8");
      const contractInfo = JSON.parse(contractJsonFile);
      const bytecode = contractInfo.bytecode.object;
      const metadata = JSON.stringify(contractInfo.metadata);
      if (this.shouldProcessContract(bytecode, contractName)) {
        console.log(`Processing: ${contractName}`);
        console.log("computed", await getIPFSHash(metadata));
        console.log("xtracted", extractIPFSHashFromBytecode(bytecode));
        console.log("----------");
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
