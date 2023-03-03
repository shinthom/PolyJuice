// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract DemoMotherERC721 is ERC721 {
    uint256 private _tokenId;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) {}

    function mint(address to) public {
        require(to != address(0), "DemoMotherERC721: mint to the zero address");

        for (uint256 i = 0; i < 100; i++) {
            _mint(to, _tokenId);
            _tokenId += 1;
        }
    }
}

