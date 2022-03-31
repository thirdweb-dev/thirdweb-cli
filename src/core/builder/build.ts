import { ContractPayload } from "../interfaces/ContractPayload";
import { ProjectType } from "./../types/ProjectType";
import { HardhatBuilder } from "./hardhat";

export default async function build(
  path: string,
  projectType: ProjectType
): Promise<{
  contracts: ContractPayload[];
}> {
  switch (projectType) {
    case "hardhat": {
      const builder = new HardhatBuilder();
      return await builder.compile({
        name: "",
        projectPath: path,
      });
    }

    case "foundry": {
      throw new Error("Foundry not yet supported");
    }

    default: {
      throw new Error("Unknown project type");
    }
  }
}
