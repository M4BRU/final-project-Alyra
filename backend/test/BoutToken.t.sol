// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test} from "forge-std/Test.sol";
import {DeployBoutToken} from "script/DeployBoutToken.s.sol";
import {BoutToken} from "src/BoutToken.sol";

contract BoutTokenTest is Test{
    BoutToken public boutToken;
    //DeployBoutToken public deployer;

    address bob = makeAddr("bob");
    address tracker = makeAddr("tracker");
    address owner = makeAddr("owner");

    uint256 public constant STARTING_MINT = 100 ether;

    function setUp() public{
        //deployer = new DeployBoutToken();
        vm.prank(owner);
        boutToken = new BoutToken();

        //boutToken.transfer(bob, STARTING_BALANCE);
    }

    modifier TrackerSet(){
        vm.prank(owner);
        boutToken.setTracker(tracker);
        _;
    }

    function testInitialState() public view{
        assertEq(boutToken.name(), "BoutToken");
        assertEq(boutToken.symbol(), "BOUT");
        assertEq(boutToken.owner(), owner);
        assertEq(boutToken.tracker(), address(0));
    }
    function testSetTracker() public TrackerSet
    {
        vm.prank(owner);
        boutToken.setTracker(tracker);
        assertEq(boutToken.tracker(), tracker);
    }

    function testSetTrackerRevertNotOwner() public{
        vm.expectRevert();
        boutToken.setTracker(tracker);
    }

    function testSetTrackerRevertZeroAddress() public{
        vm.prank(owner);
        vm.expectRevert();
        boutToken.setTracker(address(0));
    }

    function testMint() public TrackerSet{
        vm.prank(tracker);
        boutToken.mint(tracker, STARTING_MINT);
        assertEq(boutToken.balanceOf(tracker), STARTING_MINT);
    }

    function testMintRevertNotOWner() public TrackerSet{
        vm.expectRevert();
        boutToken.mint(tracker, STARTING_MINT);
    }

    function testMintRevertZeroAddress() public TrackerSet{
        vm.prank(tracker);
        vm.expectRevert();
        boutToken.mint(address(0),STARTING_MINT);
    }

    function testMintRevertZeroAMount() public TrackerSet{
        vm.prank(tracker);
        vm.expectRevert();
        boutToken.mint(tracker, 0);
    }
}
