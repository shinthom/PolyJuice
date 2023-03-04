import axios from "axios";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
const hre = require("hardhat");

const instance = axios.create({
  baseURL: "http://127.0.0.1:3000/",
});

const apis = () => {
  interface Bidding {
    lender: string;
    borrower: string;
    erc721: string;
    tokenId: string;
    erc20: string;
    amount: string;
    listingExpiration: string;
    biddingExpiration: string;
    duration: string;
    signature: string;
  }

  interface Child {
    platform: string;
    motherERC721: string;
    motherERC721Name: string;
    childERC721: string;
    name: string;
    symbol: string;
  }

  const getBidding = async (id: string) => {
    return await instance({
      method: "GET",
      url: `bidding/${id}`,
    });
  };

  const createBidding = async (bidding: Bidding) => {
    return await instance({
      method: "POST",
      url: "bidding",
      data: {
        ...bidding,
      },
    });
  };

  const deleteBidding = async (id: string) => {
    return await instance({
      method: "DELETE",
      url: `bidding/${id}`,
    });
  };

  const getChildById = async (id: string) => {
    return await instance({
      method: "GET",
      url: `child/${id}`,
    });
  };

  const getChild = async (erc721: string, tokenId: number) => {
    return await instance({
      method: "GET",
      url: `child/${erc721}/${tokenId}`,
    });
  };

  const createChild = async (child: Child, num: number) => {
    return await instance({
      method: "POST",
      url: `child/${num}`,
      data: {
        ...child,
      },
    });
  };

  const setChildRentalStatus = async (
    erc721: string,
    tokenId: number,
    expiredAt: number
  ) => {
    return await instance({
      method: "PUT",
      url: `/child/${erc721}/${tokenId}/rental/${expiredAt}`,
    });
  };

  return {
    getBidding,
    createBidding,
    deleteBidding,
    getChild,
    getChildById,
    createChild,
    setChildRentalStatus,
  };
};

const deployContractsAndSetupForDemo = async (admin: any) => {
  const deployChildERC721 = async (
    name: string,
    symbol: string,
    platform: string,
    motherERC721: any,
    polyJuice: any
  ) => {
    const ChildERC721 = await ethers.getContractFactory("ChildERC721");
    const childERC721 = await ChildERC721.deploy(
      name,
      symbol,
      platform,
      motherERC721.address,
      polyJuice.address
    );
    await childERC721.deployed();

    return childERC721;
  };
  console.log(
    "\nstarting PolyJuice deployment ⬇️\n===================================================================================================================================="
  );
  const PolyJuice = await ethers.getContractFactory("PolyJuice");
  const polyJuice = await PolyJuice.deploy();
  await polyJuice.deployed();
  console.log("deployed PolyJuice contract at", polyJuice.address);

  console.log(
    "\nstarting MotherERC721 deployment⬇️\n===================================================================================================================================="
  );
  const BAYC = await ethers.getContractFactory("MotherERC721");
  const bayc = await BAYC.deploy("MotherERC721", "mERC721");
  await bayc.deployed();

  await bayc.mint(admin.address);
  console.log(
    `BAYC: ${bayc.address} (admin: ${
      admin.address
    }, balance: ${await bayc.balanceOf(admin.address)})`
  );

  console.log(
    "\nstarting ChildERC721s deployment ⬇️\n===================================================================================================================================="
  );

  const BAYCs = await deployChildERC721(
    "Bored Ape Yacht Club at Sandbox",
    "BAYCs",
    "Sandbox",
    bayc,
    polyJuice
  );
  const BAYCd = await deployChildERC721(
    "Bored Ape Yacht Club at Decentraland",
    "BAYCd",
    "Decentraland",
    bayc,
    polyJuice
  );
  const BAYCx = await deployChildERC721(
    "Bored Ape Yacht Club at Xociety",
    "BAYCx",
    "Xociety",
    bayc,
    polyJuice
  );

  console.log(
    `BAYC at Sandbox     : ${BAYCs.address} (admin: ${
      admin.address
    }, balance: ${await BAYCs.balanceOf(admin.address)})`
  );
  console.log(
    `BAYC at Decentraland: ${BAYCd.address} (admin: ${
      admin.address
    }, balance: ${await BAYCd.balanceOf(admin.address)})`
  );
  console.log(
    `BAYC at Xociety     : ${BAYCx.address} (admin: ${
      admin.address
    }, balance: ${await BAYCx.balanceOf(admin.address)})`
  );

  console.log(
    "\nstarting ERC20(USDC) deployment ⬇️\n===================================================================================================================================="
  );
  const USDC = await ethers.getContractFactory("USDC");
  const usdc = await USDC.deploy("USD Coin", "USDC");
  await usdc.deployed();
  console.log("deployed USDC contract at", usdc.address);

  console.log(
    "\nstarting Faucet deployment ⬇️\n===================================================================================================================================="
  );
  const Faucet = await ethers.getContractFactory("Faucet");
  const faucet = await Faucet.deploy(
    admin.address,
    usdc.address,
    bayc.address,
    BAYCs.address,
    BAYCd.address,
    BAYCx.address,
    {
      value: ethers.utils.parseEther("100"),
    }
  );
  await faucet.deployed();
  console.log("deployed Faucet contract at", faucet.address);

  console.log(
    "\nstarting setup ⬇️\n===================================================================================================================================="
  );

  await usdc.approve(faucet.address, ethers.constants.MaxUint256);
  console.log(
    `- transfer(ETH): faucet(${
      faucet.address
    }), amount: ${await ethers.provider.getBalance(faucet.address)}`
  );

  console.log(
    `- approve(USDC): faucet(${faucet.address}), amount: ${ethers.constants.MaxUint256}`
  );

  await bayc.setApprovalForAll(faucet.address, true);
  console.log(`- setApprovalForAll(BAYC): faucet(${faucet.address})`);

  await BAYCs.setApprovalForAll(faucet.address, true);
  console.log(`- setApprovalForAll(BAYCs): faucet(${faucet.address})`);

  await BAYCd.setApprovalForAll(faucet.address, true);
  console.log(`- setApprovalForAll(BAYCd): faucet(${faucet.address})`);

  await BAYCx.setApprovalForAll(faucet.address, true);
  console.log(`- setApprovalForAll(BAYCx): faucet(${faucet.address})`);

  return { polyJuice, bayc, BAYCx, BAYCs, BAYCd, usdc, faucet };
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

  const api = apis();

  const accounts = await hre.ethers.getSigners();
  const admin = accounts[0];

  const { polyJuice, bayc, BAYCs, BAYCd, BAYCx, usdc, faucet } =
    await deployContractsAndSetupForDemo(admin);

  // We assume that the database already has NFT information.
  // To save nft information to the database, run the `deployForDemo` script.

  const lender = accounts[1];
  console.log(
    `\nstarting faucet to lender(${lender.address}) ⬇️\n====================================================================================================================================`
  );
  console.log(`before:
- ETH: ${await ethers.provider.getBalance(lender.address)}
- USDC: ${await usdc.balanceOf(lender.address)}
- BAYC: ${await bayc.balanceOf(lender.address)}
- BAYCs: ${await BAYCs.balanceOf(lender.address)}
- BAYCd: ${await BAYCd.balanceOf(lender.address)}
- BAYCx: ${await BAYCx.balanceOf(lender.address)}`);

  await faucet.faucet(lender.address, ethers.utils.parseEther("0.1"), 1_000);
  console.log(`\nafter:
- ETH: ${await ethers.provider.getBalance(lender.address)}
- USDC: ${await usdc.balanceOf(lender.address)}
- BAYC: ${await bayc.balanceOf(lender.address)}
- BAYCs: ${await BAYCs.balanceOf(lender.address)}
- BAYCd: ${await BAYCd.balanceOf(lender.address)}
- BAYCx: ${await BAYCx.balanceOf(lender.address)}`);

  const borrower = accounts[2];
  console.log(
    `\nstarting faucet to borrower(${borrower.address}) ⬇️\n====================================================================================================================================`
  );
  console.log(`before:
- ETH: ${await ethers.provider.getBalance(borrower.address)}
- USDC: ${await usdc.balanceOf(borrower.address)}
- BAYC: ${await bayc.balanceOf(borrower.address)}
- BAYCs: ${await BAYCs.balanceOf(borrower.address)}
- BAYCd: ${await BAYCd.balanceOf(borrower.address)}
- BAYCx: ${await BAYCx.balanceOf(borrower.address)}`);

  await faucet.faucet(borrower.address, ethers.utils.parseEther("0.1"), 1_000);
  console.log(`\nafter:
- ETH: ${await ethers.provider.getBalance(borrower.address)}
- USDC: ${await usdc.balanceOf(borrower.address)}
- BAYC: ${await bayc.balanceOf(borrower.address)}
- BAYCs: ${await BAYCs.balanceOf(borrower.address)}
- BAYCd: ${await BAYCd.balanceOf(borrower.address)}
- BAYCx: ${await BAYCx.balanceOf(borrower.address)}`);

  console.log(
    `\ncreating bidding from lender(${lender.address}) ⬇️\n====================================================================================================================================`
  );
  const biddingFromLender: any = await makeBidding(lender, {
    lender: lender.address,
    borrower: ethers.constants.AddressZero,
    erc721: BAYCs.address,
    tokenId: 0,
    erc20: usdc.address,
    amount: 100,
    listingExpiration: Math.floor(Date.now() / 1000) + 86400, // + 1 day
    biddingExpiration: 0,
    duration: 86400, // 1 day
  });
  console.log(biddingFromLender);

  const biddingCreated = (await api.createBidding(biddingFromLender)).data;
  console.log(biddingCreated.message);

  console.log(
    `\nincreasing time (${
      86400 / 2
    }) ⬇️\n====================================================================================================================================`
  );
  await time.increase(86400 / 2);

  console.log(
    "\nstarting setting allowance(usdc) before fulfillment (from borrower) ⬇️\n===================================================================================================================================="
  );
  await usdc
    .connect(borrower)
    .approve(polyJuice.address, ethers.constants.MaxUint256);

  console.log(
    "\nstarting fulfillment (from borrower) ⬇️\n===================================================================================================================================="
  );

  console.log(
    `before:
- USDC(PolyJuice): ${await usdc.balanceOf(polyJuice.address)}
- BAYCs(lender)  : ${await BAYCs.balanceOf(lender.address)}
- BAYCs(borrower): ${await BAYCs.balanceOf(borrower.address)}
- USDC(lender)   : ${await usdc.balanceOf(lender.address)}
- USDC(borrower) : ${await usdc.balanceOf(borrower.address)} \n`
  );

  const tx = await polyJuice
    .connect(borrower)
    .fulfill(
      biddingFromLender.lender,
      biddingFromLender.borrower,
      biddingFromLender.erc721,
      biddingFromLender.tokenId,
      biddingFromLender.erc20,
      biddingFromLender.amount,
      biddingFromLender.listingExpiration,
      biddingFromLender.biddingExpiration,
      biddingFromLender.duration,
      biddingFromLender.signature
    );

  console.log(
    `after:
- USDC(PolyJuice): ${await usdc.balanceOf(polyJuice.address)}
- BAYCs(lender)  : ${await BAYCs.balanceOf(lender.address)}
- BAYCs(borrower): ${await BAYCs.balanceOf(borrower.address)}
- USDC(lender)   : ${await usdc.balanceOf(lender.address)}
- USDC(borrower) : ${await usdc.balanceOf(borrower.address)} \n`
  );

  const receipt: any = await tx.wait();
  const expiredAt = receipt.events[0].args.expiredAt;

  console.log(
    (await api.getChild(BAYCs.address, 0)).data.child.expiredAt + " (before)"
  );
  await api.setChildRentalStatus(BAYCs.address, 0, expiredAt);
  console.log(
    (await api.getChild(BAYCs.address, 0)).data.child.expiredAt + " (after)"
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
