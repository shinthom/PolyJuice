import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    localhost: {
      chainId: 31337,
    },
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/O7yV5F7qN-snGHB5SjIAOYKjfoYpBFSJ",
      accounts: [
        "0x70f8347e941ee588f1eaca0f0976f2e05c7470e1f8c016df6c2b17ae74019e09",
      ],
    },
  },
};

export default config;
