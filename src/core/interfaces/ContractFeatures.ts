/**
 * Represents data about detected features on a contract
 */
export interface ContractFeatures {
  /**
   * The name of the contract (with the .sol extension)
   */
  name: string;

  /**
   * The raw ABI of the contract
   */
  abi: string;

  /**
   * The features detected on the contract
   */
  features: string[];
}