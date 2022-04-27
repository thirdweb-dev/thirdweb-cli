import { existsSync, readdirSync, statSync } from "fs";
import { basename, join } from "path";
import { CompileOptions, IBuilder } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";

export abstract class BaseBuilder implements IBuilder {
  abstract compile(
    options: CompileOptions
  ): Promise<{ contracts: ContractPayload[] }>;

  protected isThirdwebContract(input: any): boolean {
    try {
      return (
        input.name === "setThirdwebInfo" &&
        input.inputs[0].internalType === "struct ThirdwebContract.ThirdwebInfo"
      );
    } catch (e) {
      return false;
    }
  }

  protected findFiles(startPath: string, filter: RegExp, results: string[]) {
    if (!existsSync(startPath)) {
      console.log("no dir ", startPath);
      return;
    }

    var files = readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
      var filename = join(startPath, files[i]);
      //skip the actual thirdweb contract itself
      if (basename(filename, ".json") === "ThirdwebContract") {
        continue;
      }
      var stat = statSync(filename);
      if (stat.isDirectory()) {
        this.findFiles(filename, filter, results);
      } else if (filter.test(filename)) {
        results.push(filename);
      }
    }
  }
}
