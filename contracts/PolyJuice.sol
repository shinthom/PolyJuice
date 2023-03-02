pragma solidity ^0.8.0;

import "./ChildERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IPolyJuice {
    event PairCreated(address indexed motherERC721, address indexed childERC721);

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
        uint256 periodOfUsage;
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

        bytes32 key = keccak256(abi.encodePacked(motherERC721, childERC721));
        if (_pairs[key].motherERC721 == address(0)) {
            _pairs[key] = Pair(motherERC721, childERC721);
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
            // require(_verifySignature(), "PolyJuice: invalid signature");

            uint256 expiration = block.timestamp + duration;
            bytes32 biddingHash = keccak256(abi.encodePacked(msg.sender, borrower, erc721, tokenId, erc20, amount, duration, expiration, uint256(0), false));
            _biddings[biddingHash] = Bidding(
                msg.sender, borrower, erc721, tokenId, erc20, amount, duration, expiration, 0, false
            );

            require(IERC20(erc20).transferFrom(borrower, address(this), amount));
            // IChildERC721(erc721).lend(biddingHash, borrower, tokenId, duration);

        } else if (borrower == address(0) && biddingExpiration == 0) {
            require(lender != address(0), "PolyJuice: lender is the zero address");
            require(listingExpiration >= block.timestamp, "PolyJuice: listing expired");
            require(lender == IERC721(erc721).ownerOf(tokenId), "PolyJuice: not lender's token");
            // require(_verifySignature(), "PolyJuice: invalid signature");

            uint256 expiration = block.timestamp + duration;
            bytes32 biddingHash = keccak256(abi.encodePacked(lender, msg.sender, erc721, tokenId, erc20, amount, duration, expiration, uint256(0), false));
            require(_biddings[biddingHash].isSettled, "PolyJuice: bidding is already settled");

            _biddings[biddingHash] = Bidding(
                lender, msg.sender, erc721, tokenId, erc20, amount, duration, expiration, 0, false
            );

            require(IERC20(erc20).transferFrom(msg.sender, address(this), amount));
            // IChildERC721(erc721).lend(biddingHash, borrower, tokenId, duration);

        } else {
            revert("PolyJuice: invalid parameters");
        }
    }

    function settle(bytes32 biddleHash) public returns (uint256) {
        Bidding storage bidding = _biddings[biddleHash];
        uint256 expiration = bidding.expiration;
        uint256 periodOfUsage = expiration <= block.timestamp ? expiration : block.timestamp - expiration;

        bidding.periodOfUsage = periodOfUsage;
        bidding.isSettled = true;

        uint256 fee = _calculateFee(periodOfUsage);
        require(IERC20(bidding.erc20).transferFrom(address(this), bidding.lender, fee));

        return fee;
    }

    function _calculateFee(uint256 periodOfUsage) internal returns (uint256) {
        return 200;

        // todo: calc fee
        // if (expiration <= block.timestamp) return expiration;
        // return block.timestamp - expiration;
    }

    function pair(bytes32 biddingHash) public view returns (Pair memory) {
        return _pairs[biddingHash];
    }

    function biddings(bytes32 biddingHash) public view returns (Bidding memory) {
        return _biddings[biddingHash];
    }
}
