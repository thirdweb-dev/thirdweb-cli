import { ContractPayload } from "../interfaces/ContractPayload";
import { ProjectType } from "./../types/ProjectType";
import { FoundryBuilder } from "./foundry";
import { HardhatBuilder } from "./hardhat";

export default async function build(
  path: string,
  projectType: ProjectType,
  clean: boolean
): Promise<{
  contracts: ContractPayload[];
}> {
  switch (projectType) {
    case "hardhat": {
      const builder = new HardhatBuilder();
      return await builder.compile({
        name: "",
        projectPath: path,
        clean,
      });
    }

    case "foundry": {
      const builder = new FoundryBuilder();
      return await builder.compile({
        name: "",
        projectPath: path,
        clean,
      });
    }

    default: {
      throw new Error("Unknown project type");
    }
  }
}
