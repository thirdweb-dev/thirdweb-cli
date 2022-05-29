// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@thirdweb-dev/contracts/ThirdwebContract.sol";

contract ConstructorParams is ThirdwebContract {
    bytes32 public immutable contractUri;
    uint256 contractId;
    address addr;
    address[] addrs;
    uint256[] ids;

    constructor(address someAddress, bytes32 uri, uint256 someId, address[] memory someAddresses, uint256[] memory someIds) {
        contractUri = uri;
        contractId = someId;
        addr = someAddress;
        addrs = someAddresses;
        ids = someIds;
    }
}
