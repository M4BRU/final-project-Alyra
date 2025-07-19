// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";

contract HelperConfig is Script {
    NetworkConfig public activeNetworkConfig;

    uint256 public constant DEFAULT_REWARD_PER_BOTTLE = 10 * 1e18; // 10 BOUT tokens par bouteille
    uint256 public constant DEFAULT_SUPPLIER_BONUS_RATE = 10; // 10% bonus pour le supplier
    uint256 public constant DEFAULT_MAX_ACTIVE_PACKAGES = 50;

    struct NetworkConfig {
        uint256 rewardPerBottle;
        uint256 supplierBonusRate;
        uint256 maxActivePackages;
    }

    constructor() {
        if (block.chainid == 11155111) {
            activeNetworkConfig = getSepoliaConfig();
        } else if (block.chainid == 80002) {
            activeNetworkConfig = getPolygonAmoyConfig();
        } else if (block.chainid == 1) {
            activeNetworkConfig = getMainnetConfig();
        } else {
            activeNetworkConfig = getAnvilConfig();
        }
    }

    function getSepoliaConfig() public pure returns (NetworkConfig memory) {
        NetworkConfig memory sepoliaConfig = NetworkConfig({
            rewardPerBottle: DEFAULT_REWARD_PER_BOTTLE,
            supplierBonusRate: DEFAULT_SUPPLIER_BONUS_RATE,
            maxActivePackages: DEFAULT_MAX_ACTIVE_PACKAGES
        });
        return sepoliaConfig;
    }

    function getPolygonAmoyConfig() public pure returns (NetworkConfig memory) {
        NetworkConfig memory polygonAmoyConfig = NetworkConfig({
            rewardPerBottle: DEFAULT_REWARD_PER_BOTTLE,
            supplierBonusRate: DEFAULT_SUPPLIER_BONUS_RATE,
            maxActivePackages: DEFAULT_MAX_ACTIVE_PACKAGES
        });
        return polygonAmoyConfig;
    }

    function getMainnetConfig() public pure returns (NetworkConfig memory) {
        NetworkConfig memory mainnetConfig = NetworkConfig({
            rewardPerBottle: DEFAULT_REWARD_PER_BOTTLE,
            supplierBonusRate: DEFAULT_SUPPLIER_BONUS_RATE,
            maxActivePackages: DEFAULT_MAX_ACTIVE_PACKAGES
        });
        return mainnetConfig;
    }

    function getAnvilConfig() public pure returns (NetworkConfig memory) {
        NetworkConfig memory anvilConfig = NetworkConfig({
            rewardPerBottle: DEFAULT_REWARD_PER_BOTTLE,
            supplierBonusRate: DEFAULT_SUPPLIER_BONUS_RATE,
            maxActivePackages: DEFAULT_MAX_ACTIVE_PACKAGES
        });
        return anvilConfig;
    }
}
