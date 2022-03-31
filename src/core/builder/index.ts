import { Contract } from "./../interfaces/Contract";
import { Builder as IBuilder } from "../interfaces/Builder";
import { Project } from "../interfaces/Project";
import { readFileSync, writeFileSync } from "fs";
import { Logger } from "tslog";
import solc from "solc";
import { IStorage } from "../interfaces/IStorage";

export class Builder implements IBuilder {
  private logger = new Logger({
    name: "Builder",
  });

  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  public async compile(options: {
    projectPath: string;
    name: string;
  }): Promise<{
    project: Project;
    hash: string;
  }> {
    // TODO: do not assume that a contract file is passed in, this is temporary
    const contractFileContents = await readFileSync(
      options.projectPath,
      "utf-8"
    );

    const sourceFileName = options.projectPath.split("/").pop() as string;
    this.logger.info(contractFileContents);

    const input = {
      language: "Solidity",
      sources: {
        // TODO: this is temporary
        [sourceFileName]: {
          content: contractFileContents,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    await writeFileSync("/tmp/output.json", JSON.stringify(output));

    const contracts: Contract[] = [];
    // TODO: this is temporary, we shoult not use hardcoded source
    for (const contractName of Object.keys(output.contracts[sourceFileName])) {
      const abi = JSON.stringify(
        output.contracts[sourceFileName][contractName].abi
      );

      const bytecode =
        output.contracts[sourceFileName][contractName].evm.bytecode.object;

      contracts.push({
        name: contractName,
        abiUri: await this.storage.upload(abi),
        bytecodeUri: await this.storage.upload(bytecode),
      });
    }

    const project = {
      name: options.name,
      contracts,
    };
    return {
      hash: await this.upload(project),
      project,
    };
  }

  public async upload(project: Project): Promise<string> {
    return await this.storage.upload(JSON.stringify(project));
  }
}
