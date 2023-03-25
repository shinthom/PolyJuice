// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Test} from "forge-std/Test.sol";

import {PolyJuice, IPolyJuice} from "../contracts/PolyJuice.sol";
import {ChildERC721, IChildERC721} from "../contracts/ChildERC721.sol";
import {MotherERC721} from "../contracts/demo/MotherERC721.sol";
import {USDC} from "../contracts/demo/USDC.sol";

abstract contract BaseTest is Test {
    PolyJuice internal polyJuice;
    MotherERC721 internal mother;
    ChildERC721 internal child;
    USDC internal usdc;

    address internal lender;
    uint256 internal lenderPk;
    address internal borrower;
    uint256 internal borrowerPk;

    uint256 internal constant TOKEN_ID = 0;
    uint256 internal constant AMOUNT = 1_000;
    uint256 internal constant DURATION = 7 days;

    function setUp() public virtual {
        (lender, lenderPk) = makeAddrAndKey("lender");
        (borrower, borrowerPk) = makeAddrAndKey("borrower");

        polyJuice = new PolyJuice();
        mother = new MotherERC721("Mother", "MTHR");
        child = new ChildERC721("Child", "CHLD", "sandbox", address(mother), address(polyJuice));
        usdc = new USDC("USD Coin", "USDC");

        // lender owns mother token 0; mint the matching child token to the same owner
        mother.mint(lender); // mints ids 0..99 to lender
        child.mint(TOKEN_ID);

        // fund borrower with USDC
        usdc.transfer(borrower, 1_000_000);
    }

    function _sign(uint256 pk, bytes32 messageHash) internal pure returns (bytes memory) {
        bytes32 ethHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, ethHash);
        return abi.encodePacked(r, s, v);
    }

    // Borrower posts an offer (bid); lender's token owner accepts by calling fulfill.
    // lender == 0 && listingExpiration == 0 => "bid" branch.
    function _fulfillFromBid(uint256 biddingExpiration) internal returns (bytes32 id_) {
        bytes32 hash = polyJuice.biddingHash(
            address(0), borrower, address(child), TOKEN_ID, address(usdc),
            AMOUNT, 0, biddingExpiration, DURATION
        );
        bytes memory sig = _sign(borrowerPk, hash);

        vm.prank(borrower);
        usdc.approve(address(polyJuice), AMOUNT);

        vm.prank(lender); // owner of the child token accepts
        polyJuice.fulfill(
            address(0), borrower, address(child), TOKEN_ID, address(usdc),
            AMOUNT, 0, biddingExpiration, DURATION, sig
        );

        id_ = polyJuice.id(lender, borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, DURATION);
    }

    // Lender lists; borrower accepts (rent now). borrower == 0 && biddingExpiration == 0 => "listing" branch.
    function _fulfillFromListing(uint256 listingExpiration) internal returns (bytes32 id_) {
        bytes32 hash = polyJuice.biddingHash(
            lender, address(0), address(child), TOKEN_ID, address(usdc),
            AMOUNT, listingExpiration, 0, DURATION
        );
        bytes memory sig = _sign(lenderPk, hash);

        vm.prank(borrower);
        usdc.approve(address(polyJuice), AMOUNT);

        vm.prank(borrower); // renter accepts the listing
        polyJuice.fulfill(
            lender, address(0), address(child), TOKEN_ID, address(usdc),
            AMOUNT, listingExpiration, 0, DURATION, sig
        );

        id_ = polyJuice.id(lender, borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, DURATION);
    }
}
