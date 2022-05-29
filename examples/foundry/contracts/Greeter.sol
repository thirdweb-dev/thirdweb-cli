// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@thirdweb-dev/contracts/ThirdwebContract.sol";
import "@thirdweb-dev/contracts/feature/ContractMetadata.sol";
import "@thirdweb-dev/contracts/feature/interface/IMintableERC20.sol";

contract Greeter is ERC20, ThirdwebContract, ContractMetadata, IMintableERC20 {
    
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000);
        owner = msg.sender;
    }

    function _canSetContractURI() internal virtual override returns (bool) {
        return msg.sender == owner;
    }

    function mintTo(address to, uint256 amount) external override {
        require(msg.sender == owner);
        _mint(to, amount);
    }
    
}
