import axios from "axios";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
const hre = require("hardhat");

const instance = axios.create({
  baseURL: "http://43.201.71.58:3000/",
});

const api = () => {
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
    childERC721Name: string;
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
        bidding,
      },
    });
  };

  const deleteBidding = async (id: string) => {
    return await instance({
      method: "DELETE",
      url: `bidding/${id}`,
    });
  };

  const getChild = async (id: string) => {
    return await instance({
      method: "GET",
      url: `child/${id}`,
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

  return { getBidding, createBidding, deleteBidding, getChild, createChild };
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
      value: ethers.utils.parseEther("10"),
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

async function main() {
  await hre.run("compile");

  const { getBidding, createBidding, deleteBidding, getChild, createChild } =
    api();

  const accounts = await hre.ethers.getSigners();
  const admin = accounts[0];

  const { polyJuice, bayc, BAYCx, BAYCs, BAYCd, usdc, faucet } =
    await deployContractsAndSetupForDemo(admin);

  const isDatabaseInitializedForNFTs = false;
  if (!isDatabaseInitializedForNFTs) {
    console.log(
      "\nstarting calling apis to add childs to database ⬇️\n===================================================================================================================================="
    );
    console.log(
      (
        await createChild(
          {
            platform: "Sandbox",
            motherERC721: bayc.address,
            motherERC721Name: "BAYC",
            childERC721: BAYCs.address,
            childERC721Name: "BAYCs",
          },
          100
        )
      ).data.message
    );
    console.log(
      (
        await createChild(
          {
            platform: "Decentraland",
            motherERC721: bayc.address,
            motherERC721Name: "BAYC",
            childERC721: BAYCd.address,
            childERC721Name: "BAYCd",
          },
          100
        )
      ).data.message
    );
    console.log(
      (
        await createChild(
          {
            platform: "Xociety",
            motherERC721: bayc.address,
            motherERC721Name: "BAYC",
            childERC721: BAYCx.address,
            childERC721Name: "BAYCx",
          },
          100
        )
      ).data.message
    );
  }

  const lender = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
  console.log(
    `\nstarting faucet to borrower(${lender}) ⬇️\n====================================================================================================================================`
  );
  console.log(`before:
- ETH: ${await ethers.provider.getBalance(lender)}
- USDC: ${await usdc.balanceOf(lender)}
- BAYC: ${await bayc.balanceOf(lender)}
- BAYCs: ${await BAYCs.balanceOf(lender)}
- BAYCd: ${await BAYCd.balanceOf(lender)}
- BAYCx: ${await BAYCx.balanceOf(lender)}`);

  await faucet.faucet(lender, ethers.utils.parseEther("0.1"), 10_000);
  console.log(`\nafter:
- ETH: ${await ethers.provider.getBalance(lender)}
- USDC: ${await usdc.balanceOf(lender)}
- BAYC: ${await bayc.balanceOf(lender)}
- BAYCs: ${await BAYCs.balanceOf(lender)}
- BAYCd: ${await BAYCd.balanceOf(lender)}
- BAYCx: ${await BAYCx.balanceOf(lender)}`);

  const borrower = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";
  console.log(
    `\nstarting faucet to borrower(${borrower}) ⬇️\n====================================================================================================================================`
  );
  console.log(`before:
- ETH: ${await ethers.provider.getBalance(borrower)}
- USDC: ${await usdc.balanceOf(borrower)}
- BAYC: ${await bayc.balanceOf(borrower)}
- BAYCs: ${await BAYCs.balanceOf(borrower)}
- BAYCd: ${await BAYCd.balanceOf(borrower)}
- BAYCx: ${await BAYCx.balanceOf(borrower)}`);

  await faucet.faucet(lender, ethers.utils.parseEther("0.1"), 10_000);
  console.log(`\nafter:
- ETH: ${await ethers.provider.getBalance(borrower)}
- USDC: ${await usdc.balanceOf(borrower)}
- BAYC: ${await bayc.balanceOf(borrower)}
- BAYCs: ${await BAYCs.balanceOf(borrower)}
- BAYCd: ${await BAYCd.balanceOf(borrower)}
- BAYCx: ${await BAYCx.balanceOf(borrower)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
