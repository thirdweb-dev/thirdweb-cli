import { execSync } from "child_process";
import { readdirSync, readFileSync } from "fs";
import { Logger } from "tslog";
import { Builder as IBuilder } from "../interfaces/Builder";
import { Contract } from "../interfaces/Contract";
import { ContractPayload } from "../interfaces/ContractPayload";
import { Project } from "../interfaces/Project";

const logger = new Logger({
  name: "HardhatBuilder",
});

export class HardhatBuilder implements IBuilder {
  constructor() {}

  public async compile(options: {
    projectPath: string;
    name: string;
  }): Promise<{
    contracts: ContractPayload[];
  }> {
    const stdout = await execSync(
      `cd ${options.projectPath} && npx hardhat compile`
    );

    logger.info("stdout from hardhat:", stdout.toString());

    const artifacts = `${options.projectPath}/artifacts/contracts`;
    const directories = await readdirSync(artifacts, { withFileTypes: true });
    const contractDirectoryNames = directories
      .filter((d: any) => d.isDirectory())
      .map((d) => d.name);

    const contracts: ContractPayload[] = [];
    for (const contractDirectoryName of contractDirectoryNames) {
      const contractName = contractDirectoryName.split(".")[0];

      logger.info("Handling contract " + contractName);

      const contractJsonFile = await readFileSync(
        `${artifacts}/${contractDirectoryName}/${contractName}.json`,
        "utf-8"
      );

      const contractInfo = JSON.parse(contractJsonFile);
      const abi = contractInfo.abi;
      const bytecode = contractInfo.bytecode;

      contracts.push({
        abi,
        bytecode,
        name: contractDirectoryName,
      });
    }

    return {
      contracts,
    };
  }
}
