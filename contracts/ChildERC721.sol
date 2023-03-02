pragma solidity ^0.8.0;

import "./PolyJuice.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

interface IChildERC721 {
    event Lent   (address indexed from, address indexed to, uint256 indexed tokenId, uint256 duration);
    event Claimed(address indexed from, address indexed to, uint256 indexed tokenId, uint256 fee, uint256 claimedAt);
    event Repaid (address indexed from, address indexed to, uint256 indexed tokenId, uint256 fee, uint256 repaidAt);

    function lend(address to, uint256 tokenId, uint256 duration) external;
    function claim(bytes32 biddingHash) external;
    function repay(bytes32 biddingHash) external;

    function motherERC721() external view returns (address);
    function expiration(uint256 tokenId) external view returns (uint256);
}

contract ChildERC721 is ERC721, IChildERC721 {
    address private _motherERC721;
    mapping(uint256 => uint256) private _expirations; // tokenId => expiration

    IPolyJuice private _polyJuice;

    constructor(
        string memory name_,
        string memory symbol_,
        address motherERC721_,
        address polyJuice_
    ) ERC721(name_, symbol_) {
        require(motherERC721_ != address(0), "ChildERC721: origin is the zero address");
        _motherERC721 = motherERC721_;

        require(polyJuice_ != address(0), "ChildERC721: polyJuice is the zero address");
        _polyJuice = IPolyJuice(polyJuice_);
        _polyJuice.createPair(motherERC721_, address(this));
    }

    function transferFrom(
        address,
        address,
        uint256
    ) public virtual override {
        revert("We do not allow transfer of ownership.");
    }

    function safeTransferFrom(
        address,
        address,
        uint256
    ) public virtual override {
        revert("We do not allow transfer of ownership.");
    }

    function mint(uint256 tokenId) public {
        address originOwner = IERC721(_motherERC721).ownerOf(tokenId);
        _safeMint(originOwner, tokenId);
    }

    function lend(address to, uint256 tokenId, uint256 duration) public override {
        address originOwner = IERC721(_motherERC721).ownerOf(tokenId);
        // todo: originOwner == msg.sender?
        require(msg.sender == address(_polyJuice), "ChildERC721: invalid owner ");

        uint256 expiration = block.timestamp + duration;
        _expirations[tokenId] = expiration;

        _transfer(originOwner, to, tokenId); // NOTE: It doesn't need to be safeTransfer. Forced transfer is possible through claim.
        emit Lent(originOwner, to, tokenId, duration);
    }

    function claim(bytes32 id) public override {
        IPolyJuice.Bidding memory bidding = _polyJuice.biddings(id);
        require(_expirations[bidding.tokenId] < block.timestamp, "ChildERC721: not expired");

        address originOwner = IERC721(_motherERC721).ownerOf(bidding.tokenId);
        require(msg.sender == originOwner, "ChildERC721: not origin owner");

        uint256 fee = _polyJuice.settle(id);

        address owner = _ownerOf(bidding.tokenId);
        _transfer(owner, originOwner, bidding.tokenId); // NOTE: It doesn't need to be safeTransfer. Forced transfer is possible through claim.
        emit Claimed(originOwner, owner, bidding.tokenId, fee, block.timestamp);
    }

    function repay(bytes32 id) public override {
        IPolyJuice.Bidding memory bidding = _polyJuice.biddings(id);

        address owner = ownerOf(bidding.tokenId);
        require(owner == bidding.borrower, "ChildERC721: not owner");

        uint256 fee = _polyJuice.settle(id);

        address originOwner = IERC721(_motherERC721).ownerOf(bidding.tokenId);
        _transfer(owner, originOwner, bidding.tokenId); // NOTE: It doesn't need to be safeTransfer. Forced transfer is possible through claim.
        emit Repaid(owner, originOwner, bidding.tokenId, fee, block.timestamp);
    }

    function motherERC721() public view override returns (address) {
        return address(_motherERC721);
    }

    function expiration(uint256 tokenId) public view override returns (uint256) {
        return _expirations[tokenId];
    }
}
