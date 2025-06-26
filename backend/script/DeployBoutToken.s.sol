// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol";
import {BoutToken} from "src/BoutToken.sol";

contract DeployBoutToken is Script{
    function run() external returns(BoutToken){
        vm.startBroadcast();
        BoutToken token = new BoutToken();
        vm.stopBroadcast();
        return token;
    }
}