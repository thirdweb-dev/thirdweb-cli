// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@thirdweb-dev/contracts/ThirdwebContract.sol";

contract Greeter is ERC20, ThirdwebContract, Ownable {
    
    constructor() ERC20("MyToken", "MTK") {
        _mint(_contractDeployer(), 1000000);
        _transferOwnership(_contractDeployer());
    }
}
