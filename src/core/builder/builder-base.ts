import { extractIPFSHashFromBytecode } from "../helpers/ipfs";
import { logger } from "../helpers/logger";
import { CompileOptions, IBuilder } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { existsSync, readdirSync, statSync } from "fs";
import { basename, join } from "path";

export abstract class BaseBuilder implements IBuilder {
  abstract compile(
    options: CompileOptions,
  ): Promise<{ contracts: ContractPayload[] }>;

  protected shouldProcessContract(bytecode: string, name: string): boolean {
    if (!bytecode || bytecode === "" || bytecode === "0x") {
      return false;
    }
    // TODO as CLI options
    if (
      name.toLowerCase().includes("test") ||
      name.toLowerCase().includes("mock")
    ) {
      logger.debug(`Skipping '${name}'.`);
      return false;
    }
    // ensure that we can extract IPFS hashes from the bytecode
    let ipfsHash;
    try {
      ipfsHash = extractIPFSHashFromBytecode(bytecode);
    } catch (e) {}

    if (!ipfsHash) {
      logger.debug(
        `Cannot resolve build metadata IPFS hash for contract '${name}'. Skipping ${bytecode}`,
      );
      return false;
    }
    return true;
  }

  protected isThirdwebContract(input: any): boolean {
    try {
      return (
        input.name === "tw_initializeOwner" &&
        input.inputs[0].internalType === "address"
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

    const files = readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
      const filename = join(startPath, files[i]);
      //skip the actual thirdweb contract itself
      if (basename(filename, ".json") === "ThirdwebContract") {
        continue;
      }
      const stat = statSync(filename);

      // brownie has a "depdendencies" directory *inside* the build directory, if we detect that we should skip it
      if (stat.isDirectory() && basename(filename) === "dependencies") {
        logger.debug('skipping "dependencies" directory');
        continue;
      }
      // we never want to look in node_modules
      else if (stat.isDirectory() && basename(filename) === "node_modules") {
        logger.debug('skipping "node_modules" directory');
        continue;
      }
      if (stat.isDirectory()) {
        this.findFiles(filename, filter, results);
      } else if (filter.test(filename)) {
        results.push(filename);
      }
    }
  }
}
