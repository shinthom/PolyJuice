// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ChildERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "hardhat/console.sol";

// todo: add cancel logic

interface IPolyJuice {
    event PairCreated(address indexed motherERC721, address indexed childERC721);
    event Fulfilled(
        bytes32 indexed id,
        address lender,
        address borrower,
        address erc721,
        uint256 tokenId,
        address erc20,
        uint256 amount,
        uint256 duration
    );
    event Settled(
        bytes32 indexed id,
        uint256 usagePeriod
    );

    struct Pair {
        address motherERC721;
        address childERC721;
    }
    struct Bidding {
        address lender;
        address borrower;
        address erc721;
        uint256 tokenId;
        address erc20;
        uint256 amount;
        uint256 duration;
        uint256 expiration;
        uint256 usagePeriod;
        bool isSettled;
    }

    function createPair(address motherERC721, address childERC721) external;
    function fulfill(
        address lender,
        address borrower,
        address erc721,
        uint256 tokenId,
        address erc20,
        uint256 amount,
        uint256 listingExpiration,
        uint256 biddingExpiration,
        uint256 duration,
        bytes calldata signature
    ) external;
    function settle(bytes32 biddleHash) external returns (uint256);

    function pair(bytes32 biddingHash) external view returns (Pair memory);
    function biddings(bytes32 biddingHash) external view returns (Bidding memory);
}

contract PolyJuice is IPolyJuice {
    mapping(bytes32 => Pair) private _pairs;
    mapping(bytes32 => Bidding) private _biddings;

    function createPair(address motherERC721, address childERC721) public {
        require(motherERC721 != address(0) &&
                childERC721  != address(0),
                "PolyJuice: zero address"
        );

        bytes32 key_ = keccak256(abi.encodePacked(motherERC721, childERC721));
        if (_pairs[key_].motherERC721 == address(0)) {
            _pairs[key_] = Pair(motherERC721, childERC721);
            emit PairCreated(motherERC721, childERC721);
        }
    }

    function fulfill(
        address lender,
        address borrower,
        address erc721,
        uint256 tokenId,
        address erc20,
        uint256 amount,
        uint256 listingExpiration,
        uint256 biddingExpiration,
        uint256 duration,
        bytes calldata signature
    ) public {
        if (lender == address(0) && listingExpiration == 0) {
            require(borrower != address(0), "PolyJuice: borrower is the zero address");
            require(biddingExpiration >= block.timestamp, "PolyJuice: bidding expired");
            require(msg.sender == IERC721(erc721).ownerOf(tokenId), "PolyJuice: not borrower's token");
            require(_verifySignature(
                borrower,
                biddingHash(
                    lender,
                    borrower,
                    erc721,
                    tokenId,
                    erc20,
                    amount,
                    listingExpiration,
                    biddingExpiration,
                    duration
                ),
                signature
            ), "PolyJuice: invalid signature");

            bytes32 id_ = keccak256(abi.encodePacked(
                msg.sender,
                borrower,
                erc721,
                tokenId,
                erc20,
                amount,
                duration
            ));
            _biddings[id_] = Bidding(
                msg.sender, borrower, erc721, tokenId, erc20, amount, duration, block.timestamp + duration, 0, false
            );
            emit Fulfilled(id_, msg.sender, borrower, erc721, tokenId, erc20, amount, duration);

            require(IERC20(erc20).transferFrom(borrower, address(this), amount));
            IChildERC721(erc721).lend(borrower, tokenId, duration);

        } else if (borrower == address(0) && biddingExpiration == 0) {
            require(lender != address(0), "PolyJuice: lender is the zero address");
            require(listingExpiration >= block.timestamp, "PolyJuice: listing expired");
            require(lender == IERC721(erc721).ownerOf(tokenId), "PolyJuice: not lender's token");
            require(_verifySignature(
                lender,
                biddingHash(
                    lender,
                    borrower,
                    erc721,
                    tokenId,
                    erc20,
                    amount,
                    listingExpiration,
                    biddingExpiration,
                    duration
                ),
                signature
            ), "PolyJuice: invalid signature");

            bytes32 id_ = keccak256(abi.encodePacked(
                lender,
                msg.sender,
                erc721,
                tokenId,
                erc20,
                amount,
                duration
            ));
            _biddings[id_] = Bidding(
                lender, msg.sender, erc721, tokenId, erc20, amount, duration, block.timestamp + duration, 0, false
            );
            emit Fulfilled(id_, lender, msg.sender, erc721, tokenId, erc20, amount, duration);

            require(IERC20(erc20).transferFrom(msg.sender, address(this), amount));
            IChildERC721(erc721).lend(msg.sender, tokenId, duration);

        } else {
            revert("PolyJuice: invalid parameters");
        }
    }

    function settle(bytes32 id_) public returns (uint256) {
        Bidding storage bidding = _biddings[id_];
        require(msg.sender == bidding.erc721, "PolyJuice: invalid msg.sender");

        uint256 usagePeriod_ = usagePeriod(id_);
        bidding.usagePeriod = usagePeriod_;

        bidding.isSettled = true;
        emit Settled(id_, usagePeriod_);

        uint256 fee_ = _calculateFee(usagePeriod_, bidding.duration, bidding.amount);
        require(IERC20(bidding.erc20).transfer(bidding.lender, fee_));

        return fee_;
    }

    function _calculateFee(uint256 usagePeriod_, uint256 duration, uint256 amount) private pure returns (uint256) {
        return usagePeriod_ == duration ? amount : usagePeriod_ * amount / duration;
    }

    function _verifySignature(
        address signer,
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (bool) {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedMessageHash = keccak256(abi.encodePacked(prefix, messageHash));

        return _recoverSigner(prefixedMessageHash, signature) == signer;
    }

    function _recoverSigner(
        bytes32 messageHash,
        bytes memory signature
    ) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(signature);

        return ecrecover(messageHash, v, r, s);
    }

    function _splitSignature(
        bytes memory sig
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function key(address motherERC721, address childERC721) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(motherERC721, childERC721));
    }

    function id(
        address lender,
        address borrower,
        address erc721,
        uint256 tokenId,
        address erc20,
        uint256 amount,
        uint256 duration
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            lender,
            borrower,
            erc721,
            tokenId,
            erc20,
            amount,
            duration
        ));
    }

    function biddingHash(
        address lender,
        address borrower,
        address erc721,
        uint256 tokenId,
        address erc20,
        uint256 amount,
        uint256 listingExpiration,
        uint256 biddingExpiration,
        uint256 duration
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            lender,
            borrower,
            erc721,
            tokenId,
            erc20,
            amount,
            listingExpiration,
            biddingExpiration,
            duration
        ));
    }

    function pair(bytes32 key_) public view returns (Pair memory) {
        return _pairs[key_];
    }

    function biddings(bytes32 id_) public view returns (Bidding memory) {
        return _biddings[id_];
    }

    function usagePeriod(bytes32 id_) public view returns (uint256) {
        Bidding memory bidding = _biddings[id_];
        uint256 expiration = bidding.expiration;
        uint256 duration = bidding.duration;

        uint256 fulfilledAt = expiration - duration;
        uint256 usagePeriod_ = block.timestamp - fulfilledAt;

        return usagePeriod_ >= duration ? duration : usagePeriod_;
    }

    function fee(bytes32 id_) public view returns (uint256) {
        Bidding memory bidding = _biddings[id_];
        uint256 usagePeriod_ = usagePeriod(id_);

        return _calculateFee(usagePeriod_, bidding.duration, bidding.amount);
    }
}
