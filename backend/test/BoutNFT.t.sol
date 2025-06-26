// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {BoutNFT} from "src/BoutNFT.sol";

contract BoutNFTTest is Test{
    BoutNFT nft;

    address owner = makeAddr("owner");
    address tracker = makeAddr("tracker");
    address supplier = makeAddr("supplier");
    address consumer = makeAddr("consumer");

    uint256 public constant INITIAL_BOTTLE_COUNT = 6;
    string public constant DEFAULT_LINK = "http://alyra.fr";

    function setUp() public{
        vm.startPrank(owner);
        nft = new BoutNFT();
        nft.setTracker(tracker);
        vm.stopPrank();
    }

    function testInitialState() public view{
        assertEq(nft.name(), "Bout Package");
        assertEq(nft.symbol(), "BPKG");
        assertEq(nft.owner(), owner);
        assertEq(nft.tracker(), tracker);
        assertEq(nft.nextTokenId(), 1);
    }

    function testCreatePackage() public{
        vm.prank(tracker);
        nft.createPackage(supplier, INITIAL_BOTTLE_COUNT, DEFAULT_LINK);
        assertEq(nft.balanceOf(supplier), 1);
    }
}
