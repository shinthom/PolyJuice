// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

import {PolyJuice} from "../contracts/PolyJuice.sol";
import {ChildERC721} from "../contracts/ChildERC721.sol";

// Deploys the PolyJuice core and one ChildERC721 bound to an existing mother
// collection.
//
//   forge script script/Deploy.s.sol \
//     --rpc-url $RPC_URL --broadcast \
//     --sig "run(address,string,string,string)" \
//     <motherERC721> "Child" "cERC721" "sandbox"
contract Deploy is Script {
    function run(
        address motherERC721,
        string memory name,
        string memory symbol,
        string memory platform
    ) external {
        vm.startBroadcast();

        PolyJuice polyJuice = new PolyJuice();
        console.log("PolyJuice:", address(polyJuice));

        ChildERC721 child = new ChildERC721(
            name, symbol, platform, motherERC721, address(polyJuice)
        );
        console.log("ChildERC721:", address(child));

        vm.stopBroadcast();
    }
}
