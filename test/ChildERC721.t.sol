// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {BaseTest} from "./Base.t.sol";

contract ChildERC721Test is BaseTest {
    function test_mint_assignsToMotherOwner() public {
        // token 0 was minted in setUp
        assertEq(child.ownerOf(TOKEN_ID), lender);
        assertEq(child.motherERC721(), address(mother));
        assertEq(child.platform(), "sandbox");
    }

    function test_transfer_isBlocked() public {
        vm.startPrank(lender);

        vm.expectRevert("We do not allow transfer of ownership.");
        child.transferFrom(lender, borrower, TOKEN_ID);

        vm.expectRevert("We do not allow transfer of ownership.");
        child.safeTransferFrom(lender, borrower, TOKEN_ID);

        vm.stopPrank();
    }

    function test_lend_onlyCallableByPolyJuice() public {
        vm.prank(lender);
        vm.expectRevert("ChildERC721: invalid owner");
        child.lend(borrower, TOKEN_ID, DURATION);
    }

    function test_lend_setsExpiration() public {
        _fulfillFromBid(block.timestamp + 1 days);
        assertEq(child.expiration(TOKEN_ID), block.timestamp + DURATION);
    }

    // ----- claim (lender reclaims after expiration) -----

    function test_claim_afterExpiration_paysFullFeeToLender() public {
        bytes32 id_ = _fulfillFromBid(block.timestamp + 1 days);
        uint256 lenderBefore = usdc.balanceOf(lender);

        vm.warp(block.timestamp + DURATION + 1); // expired

        vm.prank(lender);
        child.claim(id_);

        // token returned to origin owner
        assertEq(child.ownerOf(TOKEN_ID), lender);
        // full amount paid to lender, nothing back to borrower
        assertEq(usdc.balanceOf(lender), lenderBefore + AMOUNT);
        assertEq(usdc.balanceOf(address(polyJuice)), 0);
        assertTrue(polyJuice.biddings(id_).isSettled);
    }

    function test_claim_revertsBeforeExpiration() public {
        bytes32 id_ = _fulfillFromBid(block.timestamp + 1 days);

        vm.prank(lender);
        vm.expectRevert("ChildERC721: not expired");
        child.claim(id_);
    }

    function test_claim_revertsForNonOriginOwner() public {
        bytes32 id_ = _fulfillFromBid(block.timestamp + 1 days);
        vm.warp(block.timestamp + DURATION + 1);

        vm.prank(borrower);
        vm.expectRevert("ChildERC721: not origin owner");
        child.claim(id_);
    }

    // ----- repay (borrower returns early) -----

    function test_repay_beforeExpiration_proratesFeeAndRefunds() public {
        bytes32 id_ = _fulfillFromBid(block.timestamp + 1 days);
        uint256 lenderBefore = usdc.balanceOf(lender);
        uint256 borrowerBefore = usdc.balanceOf(borrower);

        vm.warp(block.timestamp + DURATION / 4); // 25% used
        uint256 expectedFee = AMOUNT / 4;

        vm.prank(borrower);
        child.repay(id_);

        assertEq(child.ownerOf(TOKEN_ID), lender); // returned to origin owner
        assertEq(usdc.balanceOf(lender), lenderBefore + expectedFee);
        assertEq(usdc.balanceOf(borrower), borrowerBefore + (AMOUNT - expectedFee));
        assertEq(usdc.balanceOf(address(polyJuice)), 0);
    }

    function test_repay_revertsAfterTokenReturned() public {
        bytes32 id_ = _fulfillFromBid(block.timestamp + 1 days);

        // borrower returns the token; it is now back with the origin owner
        vm.prank(borrower);
        child.repay(id_);

        // a second settlement attempt fails because the borrower no longer holds it
        vm.expectRevert("ChildERC721: not owner");
        child.repay(id_);
    }
}
