import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
const hre = require("hardhat");

const deployContracts = async () => {
  const PolyJuice = await ethers.getContractFactory("PolyJuice");
  const polyJuice = await PolyJuice.deploy();
  await polyJuice.deployed();
  console.log("deployed PolyJuice contract at", polyJuice.address);

  const MotherERC721 = await ethers.getContractFactory("DemoMotherERC721");
  const motherERC721 = await MotherERC721.deploy("MotherERC721", "mERC721");
  await motherERC721.deployed();
  console.log("deployed MotherERC721 contract at", motherERC721.address);

  return { polyJuice, motherERC721 };
};

const deployChildERC721 = async (
  name: string,
  symbol: string,
  platform: string,
  motherERC721: any,
  polyJuice: any
) => {
  const ChildERC721 = await ethers.getContractFactory("DemoChildERC721");
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

async function main() {
  await hre.run("compile");

  const accounts = await hre.ethers.getSigners();
  const admin = accounts[0];

  console.log(
    "\nstarting deployment ⬇️\n===================================================================================================================================="
  );
  const { polyJuice, motherERC721 } = await deployContracts();

  console.log(
    "\nstarting minting MotherERC721 ⬇️\n===================================================================================================================================="
  );
  await motherERC721.mint(admin.address);
  console.log(
    `minted MotherERC721, balance ${await motherERC721.balanceOf(
      admin.address
    )}`
  );

  const sBAYC = await deployChildERC721(
    "Bored Ape Yacht Club at Sandbox",
    "sBAYC",
    "Sandbox",
    motherERC721,
    polyJuice
  );
  const dBAYC = await deployChildERC721(
    "Bored Ape Yacht Club at Decentraland",
    "dBAYC",
    "Decentraland",
    motherERC721,
    polyJuice
  );
  const xBAYC = await deployChildERC721(
    "Bored Ape Yacht Club at Xociety",
    "xBAYC",
    "Xociety",
    motherERC721,
    polyJuice
  );

  console.log(
    "\nstarting ChildERC721s deployment ⬇️\n===================================================================================================================================="
  );
  console.log(`BAYC at Sandbox     : ${sBAYC.address}`);
  console.log(`BAYC at Decentraland: ${dBAYC.address}`);
  console.log(`BAYC at Xociety     : ${xBAYC.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
