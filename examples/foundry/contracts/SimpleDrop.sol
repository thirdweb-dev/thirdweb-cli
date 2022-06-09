// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@thirdweb-dev/contracts/feature/LazyMintERC721.sol";
import "@thirdweb-dev/contracts/feature/ContractMetadata.sol";
import "@thirdweb-dev/contracts/feature/PermissionsEnumerable.sol";
import "@thirdweb-dev/contracts/feature/Royalty.sol";
import "@thirdweb-dev/contracts/feature/Multicall.sol";

contract SimpleDrop is ERC721, LazyMintERC721, ContractMetadata, PermissionsEnumerable, Royalty, Multicall {
    constructor() ERC721("MyToken", "MTK") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function tokenURI(uint256 _tokenId) public view override(ERC721, LazyMintERC721) returns (string memory) {
        return LazyMintERC721.tokenURI(_tokenId);
    }

     function _canLazyMint() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function _canSetContractURI() internal view override returns (bool) {
        return hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function _canSetRoyaltyInfo() internal view override returns (bool) {
       return hasRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
