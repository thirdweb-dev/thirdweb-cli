export interface Contract {
  /**
   * The name of the contract.
   */
  name: string;

  /**
   * The IPFS hash to the projects bytecode
   */
  bytecodeUri: string;

  /**
   * The IPFS hash to the projects ABI
   */
  abiUri: string;
}
