import { ContractPayload } from "./ContractPayload";

export interface Builder {
  /**
   * Compiles the project and returns the project object.
   *
   * @param project - The path to the project to compile.
   */
  compile(options: { projectPath: string; name: string }): Promise<{
    contracts: ContractPayload[];
  }>;
}
