// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../ChildERC721.sol";

contract DemoChildERC721 is ChildERC721 {
    uint256 private _tokenId;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory platform_,
        address motherERC721_,
        address polyJuice_
    ) ChildERC721(name_, symbol_, platform_, motherERC721_, polyJuice_) {
        for (uint256 i = 0; i < 100; i++) {
            address originOwner = IERC721(motherERC721_).ownerOf(_tokenId);
            _safeMint(originOwner, _tokenId);
            _tokenId += 1;
        }
    }
}

