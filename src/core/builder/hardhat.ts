import { logger } from "../helpers/logger";
import { CompileOptions } from "../interfaces/Builder";
import { ContractPayload } from "../interfaces/ContractPayload";
import { IpfsStorage } from "../storage/ipfs-storage";
import { BaseBuilder } from "./builder-base";
import { decodeAllSync } from "cbor";
import { decodeFirstSync } from "cbor";
import { decode, encode } from "cbor-x";
import { execSync } from "child_process";
import { ethers } from "ethers";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { HardhatConfig } from "hardhat/types";
import { UnixFS } from "ipfs-unixfs";
import { DAGNode } from "ipld-dag-pb";
import { toB58String } from "multihashes";
import { basename, dirname, join, resolve } from "path";

export class HardhatBuilder extends BaseBuilder {
  public async compile(options: CompileOptions): Promise<{
    contracts: ContractPayload[];
  }> {
    if (options.clean) {
      logger.info("Running hardhat clean");
      execSync("npx hardhat clean");
    }

    logger.info("Compiling...");
    execSync("npx hardhat compile");
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

    for (const file of files) {
      logger.debug("Processing:", file.replace(contractsPath, ""));
      const contractName = basename(file, ".json"); // TODO should read from ABI
      const contractJsonFile = readFileSync(file, "utf-8");
      const contractInfo = JSON.parse(contractJsonFile);

      const abi = contractInfo.abi;
      const bytecode = contractInfo.bytecode;

      // upload metadata file
      const dir = dirname(file).replace(artifactsPath, "").slice(1);
      console.log(dir);
      const metadata = buildJson.output.contracts[dir][contractName].metadata;
      console.log("uploaded", await this.uploadMetadata(metadata));
      console.log("computed", await this.getIPFSHash(metadata));

      // Extract ipfs hash from bytecode
      console.log("from bytecode", this.extractIPFSHashFromBytecode(bytecode));

      for (const input of abi) {
        if (this.isThirdwebContract(input)) {
          if (contracts.find((c) => c.name === contractName)) {
            logger.error(
              `Found multiple contracts with name "${contractName}". Contract names should be unique.`,
            );
            process.exit(1);
          }
          contracts.push({
            abi,
            bytecode,
            name: contractName,
          });
          break;
        }
      }
    }

    return {
      contracts,
    };
  }

  /**
   * Derives IPFS hash of string
   * @param  {String} str
   * @return {String}     IPFS hash (ex: "Qm")
   */
  async getIPFSHash(str: string) {
    const file = new UnixFS({
      type: "file",
      data: Buffer.from(str),
    });
    const node = new DAGNode(file.marshal());
    const metadataLink = await node.toDAGLink();
    return toB58String(metadataLink.Hash.multihash);
  }
}
