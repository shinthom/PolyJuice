import axios from "axios";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
const hre = require("hardhat");

const instance = axios.create({
  baseURL: "http://127.0.0.1:3000/",
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

async function main() {
  await hre.run("compile");

  const { getBidding, createBidding, deleteBidding, getChild, createChild } =
    api();

  const accounts = await hre.ethers.getSigners();
  const admin = accounts[0];

  const { polyJuice, bayc, BAYCx, BAYCs, BAYCd, usdc, faucet } =
    await deployContractsAndSetupForDemo(admin);

  const isDatabaseInitializedForNFTs = true;
  if (!isDatabaseInitializedForNFTs) {
    console.log(
      "\nstarting calling apis to add childs to database ⬇️\n===================================================================================================================================="
    );
    console.log(
      (
        await createChild(
          {
            platform: "sandbox",
            motherERC721: bayc.address,
            motherERC721Name: "bayc",
            childERC721: BAYCs.address,
            name: "Bored Ape Yacht Club at Sandbox",
            symbol: "BAYCs",
          },
          100
        )
      ).data.message
    );
    console.log(
      (
        await createChild(
          {
            platform: "decentraland",
            motherERC721: bayc.address,
            motherERC721Name: "bayc",
            childERC721: BAYCd.address,
            name: "Bored Ape Yacht Club at Decentraland",
            symbol: "BAYCd",
          },
          100
        )
      ).data.message
    );
    console.log(
      (
        await createChild(
          {
            platform: "xociety",
            motherERC721: bayc.address,
            motherERC721Name: "bayc",
            childERC721: BAYCx.address,
            name: "Bored Ape Yacht Club at Xociety",
            symbol: "BAYCx",
          },
          100
        )
      ).data.message
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
