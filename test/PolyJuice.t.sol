// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseTest} from "./Base.t.sol";
import {IPolyJuice} from "../contracts/PolyJuice.sol";

contract PolyJuiceTest is BaseTest {
    function test_createPair_registeredOnChildDeployment() public {
        bytes32 key_ = polyJuice.key(address(mother), address(child));
        IPolyJuice.Pair memory p = polyJuice.pair(key_);

        assertEq(p.motherERC721, address(mother));
        assertEq(p.childERC721, address(child));
    }

    function test_createPair_revertsForZeroAddress() public {
        vm.expectRevert("PolyJuice: zero address");
        polyJuice.createPair(address(0), address(child));

        vm.expectRevert("PolyJuice: zero address");
        polyJuice.createPair(address(mother), address(0));
    }

    function test_createPair_isIdempotent() public {
        // pair already exists from setUp; a second call must not revert or duplicate
        polyJuice.createPair(address(mother), address(child));
        bytes32 key_ = polyJuice.key(address(mother), address(child));
        assertEq(polyJuice.pair(key_).childERC721, address(child));
    }

    // ----- fulfill: accept a bid (borrower posted an offer) -----

    function test_fulfillFromBid_movesTokenAndEscrowsPayment() public {
        bytes32 id_ = _fulfillFromBid(block.timestamp + 1 days);

        // child token now held by borrower
        assertEq(child.ownerOf(TOKEN_ID), borrower);
        // payment escrowed in the protocol
        assertEq(usdc.balanceOf(address(polyJuice)), AMOUNT);

        IPolyJuice.Bidding memory b = polyJuice.biddings(id_);
        assertEq(b.lender, lender);
        assertEq(b.borrower, borrower);
        assertEq(b.erc721, address(child));
        assertEq(b.amount, AMOUNT);
        assertEq(b.duration, DURATION);
        assertEq(b.expiredAt, block.timestamp + DURATION);
        assertFalse(b.isSettled);
    }

    function test_fulfillFromBid_revertsWhenBiddingExpired() public {
        uint256 expiration = block.timestamp + 1 days;
        bytes32 hash = polyJuice.biddingHash(
            address(0), borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, 0, expiration, DURATION
        );
        bytes memory sig = _sign(borrowerPk, hash);

        vm.warp(expiration + 1);
        vm.prank(lender);
        vm.expectRevert("PolyJuice: bidding expired");
        polyJuice.fulfill(
            address(0), borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, 0, expiration, DURATION, sig
        );
    }

    function test_fulfillFromBid_revertsWhenCallerNotTokenOwner() public {
        uint256 expiration = block.timestamp + 1 days;
        bytes32 hash = polyJuice.biddingHash(
            address(0), borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, 0, expiration, DURATION
        );
        bytes memory sig = _sign(borrowerPk, hash);

        vm.prank(borrower); // not the token owner
        vm.expectRevert("PolyJuice: not borrower's token");
        polyJuice.fulfill(
            address(0), borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, 0, expiration, DURATION, sig
        );
    }

    function test_fulfillFromBid_revertsOnInvalidSignature() public {
        uint256 expiration = block.timestamp + 1 days;
        bytes32 hash = polyJuice.biddingHash(
            address(0), borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, 0, expiration, DURATION
        );
        bytes memory badSig = _sign(lenderPk, hash); // should be signed by borrower

        vm.prank(lender);
        vm.expectRevert("PolyJuice: invalid signature");
        polyJuice.fulfill(
            address(0), borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, 0, expiration, DURATION, badSig
        );
    }

    // ----- fulfill: accept a listing (lender listed) -----

    function test_fulfillFromListing_movesTokenAndEscrowsPayment() public {
        bytes32 id_ = _fulfillFromListing(block.timestamp + 1 days);

        assertEq(child.ownerOf(TOKEN_ID), borrower);
        assertEq(usdc.balanceOf(address(polyJuice)), AMOUNT);

        IPolyJuice.Bidding memory b = polyJuice.biddings(id_);
        assertEq(b.lender, lender);
        assertEq(b.borrower, borrower);
    }

    function test_fulfillFromListing_revertsWhenListingExpired() public {
        uint256 expiration = block.timestamp + 1 days;
        bytes32 hash = polyJuice.biddingHash(
            lender, address(0), address(child), TOKEN_ID, address(usdc), AMOUNT, expiration, 0, DURATION
        );
        bytes memory sig = _sign(lenderPk, hash);

        vm.warp(expiration + 1);
        vm.prank(borrower);
        vm.expectRevert("PolyJuice: listing expired");
        polyJuice.fulfill(
            lender, address(0), address(child), TOKEN_ID, address(usdc), AMOUNT, expiration, 0, DURATION, sig
        );
    }

    function test_fulfill_revertsForInvalidParameters() public {
        // neither pure-bid nor pure-listing shape
        vm.expectRevert("PolyJuice: invalid parameters");
        polyJuice.fulfill(
            lender, borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, 1, 1, DURATION, ""
        );
    }

    // ----- settle access control & views -----

    function test_settle_revertsForNonChildCaller() public {
        bytes32 id_ = _fulfillFromBid(block.timestamp + 1 days);

        vm.expectRevert("PolyJuice: invalid msg.sender");
        polyJuice.settle(id_); // caller is the test contract, not the child
    }

    function test_usagePeriod_capsAtDuration() public {
        bytes32 id_ = _fulfillFromBid(block.timestamp + 1 days);

        vm.warp(block.timestamp + DURATION / 2);
        assertEq(polyJuice.usagePeriod(id_), DURATION / 2);

        vm.warp(block.timestamp + DURATION * 10);
        assertEq(polyJuice.usagePeriod(id_), DURATION);
    }

    function test_fee_isProratedByUsage() public {
        bytes32 id_ = _fulfillFromBid(block.timestamp + 1 days);

        vm.warp(block.timestamp + DURATION / 4);
        assertEq(polyJuice.fee(id_), AMOUNT / 4);

        vm.warp(block.timestamp + DURATION); // fully used
        assertEq(polyJuice.fee(id_), AMOUNT);
    }

    function test_hashHelpers_areDeterministic() public {
        bytes32 k = polyJuice.key(address(mother), address(child));
        assertEq(k, keccak256(abi.encodePacked(address(mother), address(child))));

        bytes32 i = polyJuice.id(lender, borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, DURATION);
        assertEq(
            i,
            keccak256(abi.encodePacked(lender, borrower, address(child), TOKEN_ID, address(usdc), AMOUNT, DURATION))
        );
    }
}
