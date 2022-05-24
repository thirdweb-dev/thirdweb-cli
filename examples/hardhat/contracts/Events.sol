// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@thirdweb-dev/contracts/ThirdwebContract.sol";

contract Events is ERC20, ThirdwebContract {

    event MyEvent(uint256 money);

    constructor() ERC20("MyToken2", "MTK") {}
}
