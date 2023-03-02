import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
const hre = require("hardhat");

const deployContracts = async () => {
  const PolyJuice = await ethers.getContractFactory("PolyJuice");
  const polyJuice = await PolyJuice.deploy();
  await polyJuice.deployed();
  console.log("deployed PolyJuice contract at", polyJuice.address);

  const MotherERC721 = await ethers.getContractFactory(
    "ERC721PresetMinterPauserAutoId"
  );
  const motherERC721 = await MotherERC721.deploy("MotherERC721", "mERC721", "");
  await motherERC721.deployed();
  console.log("deployed MotherERC721 contract at", motherERC721.address);

  const ChildERC721 = await ethers.getContractFactory("ChildERC721");
  const childERC721 = await ChildERC721.deploy(
    "ChildERC721",
    "cERC721",
    motherERC721.address,
    polyJuice.address
  );
  await childERC721.deployed();
  console.log("deployed ChildERC721 contract at", childERC721.address);

  return { polyJuice, motherERC721, childERC721 };
};

const deployERC20AndMint = async (address: string, amount: number) => {
  const ERC20 = await ethers.getContractFactory("ERC20PresetFixedSupply");
  const erc20 = await ERC20.deploy("TestERC20", "tERC20", amount, address);
  await erc20.deployed();
  console.log("deployed ERC20 contract at", erc20.address);
  console.log("minted ERC20 to", address, "with amount", amount);

  return { erc20 };
};

const makeBidding = async (
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

async function main() {
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
  for (let i = 0; i < 10; i++) {
    await motherERC721.mint(accounts[i].address);
    console.log("minted MotherERC721", i, "to", accounts[i].address);
  }

  console.log(
    "\nstarting minting ChildERC721 ⬇️\n===================================================================================================================================="
  );
  for (let i = 0; i < 10; i++) {
    await childERC721.mint(i);
    console.log("minted ChildERC721", i, "to", accounts[i].address);
  }

  console.log(
    "\nstarting minting ERC20 ⬇️\n===================================================================================================================================="
  );
  const { erc20 } = await deployERC20AndMint(borrower.address, 1_000_000_000);

  console.log(
    "\nstarting setting allowance ERC20 ⬇️\n===================================================================================================================================="
  );
  await erc20
    .connect(borrower)
    .approve(polyJuice.address, ethers.constants.MaxUint256);
  console.log("set allowance ERC20 to", polyJuice.address);

  const contracts = { erc20, motherERC721, childERC721, polyJuice };
  const users = { lender, borrower };

  const makeBiddingWithDuration = async (duration: number): Promise<string> => {
    console.log(
      "\nstarting making bidding (from lender) ⬇️\n===================================================================================================================================="
    );
    let bidding = await makeBidding(borrower, {
      lender: ethers.constants.AddressZero,
      borrower: borrower.address,
      erc721: childERC721.address,
      tokenId: 0,
      erc20: erc20.address,
      amount: 100,
      listingExpiration: 0,
      biddingExpiration: Math.floor(Date.now() / 1000) + duration,
      duration: duration,
    });
    console.log(bidding);

    console.log(
      "\nstarting fulfillment (from lender) ⬇️\n===================================================================================================================================="
    );

    console.log(
      `before:
  - erc20(PolyJuice): ${await contracts.erc20.balanceOf(polyJuice.address)}
  - erc721(lender)  : ${await contracts.childERC721.balanceOf(
    users.lender.address
  )}
  - erc721(borrower): ${await contracts.childERC721.balanceOf(
    users.borrower.address
  )}
  - erc20(lender)   : ${await contracts.erc20.balanceOf(users.lender.address)}
  - erc20(borrower) : ${await contracts.erc20.balanceOf(
    users.borrower.address
  )} \n`
    );

    await polyJuice
      .connect(lender)
      .fulfill(
        bidding.lender,
        bidding.borrower,
        bidding.erc721,
        bidding.tokenId,
        bidding.erc20,
        bidding.amount,
        bidding.listingExpiration,
        bidding.biddingExpiration,
        bidding.duration,
        bidding.signature
      );

    console.log(
      `after:
  - erc20(PolyJuice): ${await contracts.erc20.balanceOf(polyJuice.address)}
  - erc721(lender)  : ${await contracts.childERC721.balanceOf(
    users.lender.address
  )}
  - erc721(borrower): ${await contracts.childERC721.balanceOf(
    users.borrower.address
  )}
  - erc20(lender)   : ${await contracts.erc20.balanceOf(users.lender.address)}
  - erc20(borrower) : ${await contracts.erc20.balanceOf(
    users.borrower.address
  )} \n`
    );

    const id = await polyJuice.id(
      lender.address,
      bidding.borrower,
      bidding.erc721,
      bidding.tokenId,
      bidding.erc20,
      bidding.amount,
      bidding.duration
    );
    console.log(`created id: ${id}`);
    console.log(await polyJuice.biddings(id));

    return id;
  };

  const day = 86400;
  const id = await makeBiddingWithDuration(day);

  const calculateUsagePeriodAndFeeWithTimestamp = async (timestamp: number) => {
    console.log(
      `\nincreasing time (${timestamp}) ⬇️\n====================================================================================================================================`
    );
    await time.increase(timestamp);

    console.log(`usagePeriod: ${(await polyJuice.usagePeriod(id)).toString()}`);
    console.log(`fee        : ${(await polyJuice.fee(id)).toString()}`);
  };

  console.log(
    `\ncurrent time (${await time.latest()}) ⬇️\n====================================================================================================================================`
  );
  console.log(`usagePeriod: ${(await polyJuice.usagePeriod(id)).toString()}`);
  console.log(`fee        : ${(await polyJuice.fee(id)).toString()}`);

  const increasing = Math.floor(day / 10);
  for (let i = 0; i < 10; i++) {
    await calculateUsagePeriodAndFeeWithTimestamp(increasing);
  }

  await calculateUsagePeriodAndFeeWithTimestamp(increasing);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
