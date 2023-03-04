// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Faucet {
    uint256 private _tokenId;
    address payable private _admin;

    IERC20 private _usdc;

    IERC721 private _motherERC721;
    IERC721 private _firstChildERC721;
    IERC721 private _secondChildERC721;
    IERC721 private _thirdChildERC721;

    constructor(
        address payable admin,
        IERC20 usdc,
        IERC721 motherERC721,
        IERC721 firstChildERC721,
        IERC721 secondChildERC721,
        IERC721 thirdChildERC721
    ) payable {
        _admin = admin;

        _usdc = usdc;

        _motherERC721 = motherERC721;
        _firstChildERC721 = firstChildERC721;
        _secondChildERC721 = secondChildERC721;
        _thirdChildERC721 = thirdChildERC721;
    }

    function faucet (address to, uint256 ethAmount, uint256 usdcAmount) external {
        require(msg.sender == _admin, "Only admin can withdraw");

        _motherERC721.transferFrom(_admin, to, _tokenId);
        _firstChildERC721.transferFrom(_admin, to, _tokenId);
        _secondChildERC721.transferFrom(_admin, to, _tokenId);
        _thirdChildERC721.transferFrom(_admin, to, _tokenId);

        payable(to).transfer(ethAmount);
        _usdc.transferFrom(_admin, to, usdcAmount);
    }

    function withdraw(uint256 ethAmount) external {
        payable(_admin).transfer(ethAmount);
    }
}