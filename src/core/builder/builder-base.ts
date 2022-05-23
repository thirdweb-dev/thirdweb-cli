import { logger } from "../helpers/logger";
import { CompileOptions, IBuilder } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { IpfsStorage } from "../storage/ipfs-storage";
import { decodeFirstSync } from "cbor";
import { existsSync, readdirSync, statSync } from "fs";
import { toB58String } from "multihashes";
import { basename, join } from "path";
import Web3 from "web3";

export abstract class BaseBuilder implements IBuilder {
  abstract compile(
    options: CompileOptions,
  ): Promise<{ contracts: ContractPayload[] }>;

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

  protected async uploadMetadata(metadata: any): Promise<string> {
    const ipfsHash = await new IpfsStorage().uploadSingleJSON(metadata);
    // TODO recursively upload sources
    return ipfsHash;
  }

  protected extractIPFSHashFromBytecode(bytecode: string): string | undefined {
    try {
      const numericBytecode = Web3.utils.hexToBytes(bytecode);
      const cborLength: number =
        numericBytecode[numericBytecode.length - 2] * 0x100 +
        numericBytecode[numericBytecode.length - 1];
      const bytecodeBuffer = Buffer.from(
        numericBytecode.slice(numericBytecode.length - 2 - cborLength, -2),
      );
      const cborData = decodeFirstSync(bytecodeBuffer);
      if (cborData["ipfs"]) {
        const uri = toB58String(cborData["ipfs"]);
        console.log(uri);
        return uri;
      }
    } catch (e) {
      console.log(e);
    }
    return undefined;
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
