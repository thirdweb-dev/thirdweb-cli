/**
 * Represents an uploaded contract.
 */
export interface Contract {
  /**
   * The name of the contract.
   */
  name: string;

  /**
   * The IPFS hash to the projects bytecode
   */
  bytecodeHash: string;

  /**
   * The IPFS hash to the projects ABI
   */
  abiHash: string;
}
