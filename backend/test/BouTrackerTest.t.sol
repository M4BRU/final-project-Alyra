// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BoutTracker, UserRole} from "src/BoutTracker.sol";
import {BoutNFT} from "src/BoutNFT.sol";
import {DeployBoutSystem} from "script/DeployBoutSystem.s.sol";


contract BoutTrackerTest is Test{
    BoutTracker boutTracker;
    BoutNFT boutNFT;
    address USER = makeAddr("user");
    address owner = makeAddr("owner");
    address consumer = makeAddr("consumer");
    uint256 constant BOTTLECOUNT_INITIAL = 6;
    string constant DEFAULT_LINK = "https://www.alyra.fr";


    function setUp() external{
        DeployBoutSystem deployBoutSystem = new DeployBoutSystem();
        DeployBoutSystem.DeployedContracts memory deployed = deployBoutSystem.run();
        
        
        boutTracker = deployed.boutTracker;
        boutNFT = deployed.boutNFT;
        owner = boutTracker.owner();
        console.log("Owner address:", owner);
        console.log("Test address:", address(this));
        console.log("msg.sender:", msg.sender);
    }

    function testInitialize() public {

    }
    function testRegisterAsSupplier() public{
        vm.prank(USER);
        boutTracker.registerAsSupplier();
        assertEq(boutTracker.isRegistered(USER), true);
        assertEq(boutTracker.isSupplier(USER), true);
        assertEq(boutTracker.isConsumer(USER), false);
    }

    function testRegisterAsConsumer() public{
        vm.prank(USER);
        boutTracker.registerAsConsumer();
        assertEq(boutTracker.isRegistered(USER), true);
        assertEq(boutTracker.isConsumer(USER), true);
        assertEq(boutTracker.isSupplier(USER), false);
    }

    function testCantRegisterTwice() public{
        vm.startPrank(USER);
        boutTracker.registerAsConsumer();
        vm.expectRevert(BoutTracker.BoutTracker__UserAlreadyRegistered.selector);
        boutTracker.registerAsSupplier();
        vm.stopPrank();

    }

    function testRevokeUserRole() public{
        vm.prank(USER);
        boutTracker.registerAsSupplier();
        vm.prank(owner);
        boutTracker.revokeUserRole(USER);
        assertEq(uint256(boutTracker.getUserRole(USER)), uint256(UserRole.NONE));
    }


    function testSupplierCanCreatePackage() public{
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
        assertEq(boutNFT.balanceOf(USER), 1);
    }

    function testConsumerCantCreatePackage() public{
        vm.startPrank(USER);
        boutTracker.registerAsConsumer();
        vm.expectRevert(BoutTracker.BoutTracker__OnlySupplierCanAccessFunction.selector);
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
        
    }

    function testCantCreatePackageWithZeroBottles() public{
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        vm.expectRevert(BoutTracker.BoutTracker__BottleCountIncorrect.selector);
        boutTracker.createPackage(0, DEFAULT_LINK, consumer);
        vm.stopPrank();
    }

    function testCantCreatePackageWithEmptyLink() public{
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        vm.expectRevert(BoutTracker.BoutTracker__PackageLinkEmpty.selector);
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, "", consumer);
        vm.stopPrank();
    }

    function testCantCreatePackageIfAddressConsumerEqualZero() public{
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        vm.expectRevert(BoutTracker.BoutTracker__IntendedConsumerCannotBeZero.selector);
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, address(0));
        vm.stopPrank();
    }

    function testCantCreatePackageIfConsumerNotRegistered() public{
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        vm.expectRevert(BoutTracker.BoutTracker__ConsumerAssignedIsNotRegistered.selector);
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
    }

    function testCantCreateDuplicatePackageLink() public{
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.expectRevert(BoutTracker.BoutTracker__PackageLinkAlreadyExist.selector);
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
    }

    // RECEIVE PACKAGE

    modifier PackageSentWithUserToConsumer(){
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
        _;
    }

    function testConsumerCanReceivePackage() public PackageSentWithUserToConsumer{
        vm.prank(consumer);
        boutTracker.receivePackage(DEFAULT_LINK);
        assertEq(boutNFT.balanceOf(consumer), 1);
        assertEq(uint256(boutNFT.getPackageStatus(1)),uint256(BoutNFT.PackageStatus.RECEIVED));
    }

    function testCantReceiveNonExistentPackage() public PackageSentWithUserToConsumer{
        vm.prank(consumer);
        vm.expectRevert(BoutTracker.BootTracker__PackageLinkDoesntExist.selector);
        boutTracker.receivePackage("");
    }

    function testCantReceiveAlreadyReceivedPackage() public PackageSentWithUserToConsumer{
        vm.startPrank(consumer);
        boutTracker.receivePackage(DEFAULT_LINK);
        vm.expectRevert(BoutTracker.BootTracker__PackageNotAvailable.selector);
        boutTracker.receivePackage(DEFAULT_LINK);
        vm.stopPrank();
    }

    function testCantReceiveOtherConsumerPackage() public PackageSentWithUserToConsumer{
        address consumer2 = makeAddr("consumer2");
        vm.prank(consumer2);
        vm.expectRevert(BoutTracker.BoutTracker__NotIntendedConsumer.selector);
        boutTracker.receivePackage(DEFAULT_LINK);
    }

    modifier PackageReceivedByConsumer(){
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
        vm.prank(consumer);
        boutTracker.receivePackage(DEFAULT_LINK);
        _;
    }
    function testConsumerCanReturnBottles() public PackageReceivedByConsumer{
        vm.prank(consumer);
        boutTracker.returnBottles(1, BOTTLECOUNT_INITIAL - 1);
        assertEq(boutNFT.getPackage(1).returnedCount, BOTTLECOUNT_INITIAL - 1);
        assertEq(uint256(boutNFT.getPackageStatus(1)),uint256(BoutNFT.PackageStatus.RETURNED));
    }
    
    function testCantReturnBottlesIfNotReceived() public PackageSentWithUserToConsumer{
        vm.prank(consumer);
        vm.expectRevert(BoutTracker.BootTracker__PackageNotReceived.selector);
        boutTracker.returnBottles(1, BOTTLECOUNT_INITIAL - 1);
    }

    function testCantReturnZeroBottles() public PackageReceivedByConsumer{
        vm.prank(consumer);
        vm.expectRevert(BoutTracker.BootTracker__MustReturnOneBottle.selector);
        boutTracker.returnBottles(1,0);
    }

    function testCantReturnMoreBottlesThanReceived() public PackageReceivedByConsumer{
        vm.prank(consumer);
        vm.expectRevert(BoutTracker.BootTracker__CantReturnMoreThanReceived.selector);
        boutTracker.returnBottles(1, BOTTLECOUNT_INITIAL + 1);
    }

    function testOnlyAssignedConsumerCanReturnBottles() public PackageReceivedByConsumer{
        address consumer2 = makeAddr("consumer2");
        vm.prank(consumer2);
        vm.expectRevert(BoutTracker.BoutTracker__NotIntendedConsumer.selector);
        boutTracker.returnBottles(1,BOTTLECOUNT_INITIAL - 1);
    }

    function testReturnBottlesCreatePendingRewards() public PackageReceivedByConsumer{
        vm.prank(consumer);
        boutTracker.returnBottles(1,BOTTLECOUNT_INITIAL - 1);
        uint256 consumerReward = boutTracker.getRewardPerBottleReturned() * (BOTTLECOUNT_INITIAL - 1);
        uint256 supplierBonus = (consumerReward * boutTracker.getSupplierBonusRate()) /100;

        assertEq(boutTracker.getPendingRewards(1).consumerReward, consumerReward);
        assertEq(boutTracker.getPendingRewards(1).supplierBonus, supplierBonus);
        assertEq(boutTracker.getPendingRewards(1).claimed, false);
    }

    function testFuzzPendingCalculatesCorrectAmounts(uint256 bottleCount) public PackageReceivedByConsumer{
        vm.assume(bottleCount > 0 && bottleCount <= BOTTLECOUNT_INITIAL);
        vm.prank(consumer);
        boutTracker.returnBottles(1,bottleCount);

        uint256 consumerReward = boutTracker.getRewardPerBottleReturned() * bottleCount;
        uint256 supplierBonus = (consumerReward * boutTracker.getSupplierBonusRate()) /100;

        assertEq(boutTracker.getPendingRewards(1).consumerReward, consumerReward);
        assertEq(boutTracker.getPendingRewards(1).supplierBonus, supplierBonus);
    }

    //CONFIRM RETURN

    modifier PackageReturnedByConsumer(){
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
        vm.prank(consumer);
        boutTracker.receivePackage(DEFAULT_LINK);
        vm.prank(consumer);
        boutTracker.returnBottles(1, BOTTLECOUNT_INITIAL - 1);
        _;
    }

    function testSupplierCanConfirmReturn() public PackageReturnedByConsumer{
        vm.prank(USER);
        boutTracker.confirmReturn(1);
        assertEq(uint256(boutNFT.getPackageStatus(1)),uint256(BoutNFT.PackageStatus.CONFIRMED));
        assertEq(boutTracker.getPendingRewards(1).claimed, true);
    }

    function testCantConfirmReturnIfNotReturned() public PackageReturnedByConsumer{
        vm.prank(USER);
        vm.expectRevert(BoutTracker.BootTracker__PackageNotInReturnedState.selector);
        boutTracker.confirmReturn(1);
    }

}
