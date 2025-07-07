// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {BoutToken} from "../src/BoutToken.sol";
import {BoutNFT} from "../src/BoutNFT.sol";
import {BoutTracker} from "../src/BoutTracker.sol";
import {HelperConfig} from "./HelperConfig.s.sol";

contract DeployBoutSystem is Script {
    
    struct DeployedContracts {
        BoutToken boutToken;
        BoutNFT boutNFT;
        BoutTracker boutTracker;
    }

    function run() external returns (DeployedContracts memory) {
        HelperConfig helperConfig = new HelperConfig();
        (uint256 rewardPerBottle, uint256 supplierBonusRate,) = helperConfig.activeNetworkConfig();
        
        vm.startBroadcast();
        
        // 1. Déployer BoutToken d'abord (avec tracker temporaire à address(0))
        BoutToken boutToken = new BoutToken(address(0));
        
        // 2. Déployer BoutNFT (avec tracker temporaire à address(0))
        BoutNFT boutNFT = new BoutNFT(address(0));
        
        // 3. Déployer BoutTracker avec les vraies adresses
        BoutTracker boutTracker = new BoutTracker(
            address(boutNFT),
            address(boutToken)
        );
        
        // 4. Configurer les trackers dans BoutToken et BoutNFT
        boutToken.setTracker(address(boutTracker));
        boutNFT.setTracker(address(boutTracker));
        
        // 5. Configuration optionnelle des récompenses
        boutTracker.setRewardPerBottle(rewardPerBottle);
        boutTracker.setSupplierBonusRate(supplierBonusRate);
        
        vm.stopBroadcast();
        
        return DeployedContracts({
            boutToken: boutToken,
            boutNFT: boutNFT,
            boutTracker: boutTracker
        });
    }
}