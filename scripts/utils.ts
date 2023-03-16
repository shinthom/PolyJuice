import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
const hre = require("hardhat");

export const deployContracts = async () => {
  const MotherERC721 = await ethers.getContractFactory("MotherERC721");
  const motherERC721 = await MotherERC721.deploy("MotherERC721", "mERC721");
  await motherERC721.deployed();
  console.log("deployed MotherERC721 contract at", motherERC721.address);

  const PolyJuice = await ethers.getContractFactory("PolyJuice");
  const polyJuice = await PolyJuice.deploy();
  await polyJuice.deployed();
  console.log("deployed PolyJuice contract at", polyJuice.address);

  const ChildERC721 = await ethers.getContractFactory("ChildERC721");
  const childERC721 = await ChildERC721.deploy(
    "ChildERC721",
    "cERC721",
    "",
    motherERC721.address,
    polyJuice.address
  );
  await childERC721.deployed();
  console.log("deployed ChildERC721 contract at", childERC721.address);

  return { polyJuice, motherERC721, childERC721 };
};

export const deployERC20AndMint = async (address: string, amount: number) => {
  const ERC20 = await ethers.getContractFactory("ERC20PresetFixedSupply");
  const erc20 = await ERC20.deploy("TestERC20", "tERC20", amount, address);
  await erc20.deployed();
  console.log("deployed ERC20 contract at", erc20.address);
  console.log("minted ERC20 to", address, "with amount", amount);

  return { erc20 };
};

export const makeBidding = async (
  signer: any,
  bidding: {
    lender: string;
    borrower: string;
    erc721: string;
    tokenId: number;
    erc20: string;
    amount: number;
    listingExpiration: number;
    biddingExpiration: number;
    duration: number;
  }
) => {
  const biddingPacked = ethers.utils.solidityPack(
    [
      "address", // lender
      "address", // borrower
      "address", // erc721
      "uint256", // tokenId
      "address", // erc20
      "uint256", // amount
      "uint256", // listingExpiration
      "uint256", // biddingExpiration
      "uint256", // duration
    ],
    [
      bidding.lender,
      bidding.borrower,
      bidding.erc721,
      bidding.tokenId,
      bidding.erc20,
      bidding.amount,
      bidding.listingExpiration,
      bidding.biddingExpiration,
      bidding.duration,
    ]
  );
  const biddingHash = ethers.utils.solidityKeccak256(
    ["bytes"],
    [biddingPacked]
  );
  const signature = await signer.signMessage(
    ethers.utils.arrayify(biddingHash)
  );

  return {
    ...bidding,
    signature,
  };
};

export const fixture = async () => {
  await hre.run("compile");

  const accounts = await hre.ethers.getSigners();
  const lender = accounts[0];
  const borrower = accounts[1];

  console.log(
    "\nstarting deployment ⬇️\n===================================================================================================================================="
  );
  const { polyJuice, motherERC721, childERC721 } = await deployContracts();

  console.log(
    "\nstarting minting MotherERC721 ⬇️\n===================================================================================================================================="
  );
  for (let i = 0; i < 1; i++) {
    await motherERC721.mint(accounts[i].address);
    console.log("minted MotherERC721", i, "to", accounts[i].address);
  }

  console.log(
    "\nstarting minting ChildERC721 ⬇️\n===================================================================================================================================="
  );
  for (let i = 0; i < 1; i++) {
    await childERC721.mint(i);
    console.log("minted ChildERC721", i, "to", accounts[i].address);
  }

  console.log(
    "\nstarting minting ERC20 ⬇️\n===================================================================================================================================="
  );
  const { erc20 } = await deployERC20AndMint(borrower.address, 100);

  console.log(
    "\nstarting setting allowance ERC20 ⬇️\n===================================================================================================================================="
  );
  await erc20
    .connect(borrower)
    .approve(polyJuice.address, ethers.constants.MaxUint256);
  console.log("set allowance ERC20 to", polyJuice.address);

  const contracts = { polyJuice, motherERC721, childERC721, erc20 };
  const users = { lender, borrower };

  return { contracts, users };
};

export const increaseTime = async (second: number) => {
  const beforeTimestamp = await time.latest();
  console.log(
    `\nincreasing time (${second}) ⬇️\n====================================================================================================================================`
  );
  await time.increase(second);
  const afterTimestamp = await time.latest();
  console.log(`before: ${beforeTimestamp}, after: ${afterTimestamp}`);
};
