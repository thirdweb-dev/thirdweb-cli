// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@thirdweb-dev/contracts/feature/LazyMintERC721.sol";

contract SimpleDrop is ERC721, LazyMintERC721 {
    constructor() ERC721("MyToken", "MTK") {}

    function _canLazyMint() internal pure override returns (bool) {
        return true;
    }

    function tokenURI(uint256 _tokenId) public view override(ERC721, LazyMintERC721) returns (string memory) {
        return LazyMintERC721.tokenURI(_tokenId);
    }
}
