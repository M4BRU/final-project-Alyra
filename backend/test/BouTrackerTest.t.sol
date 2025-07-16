// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {BoutTracker, UserRole, SupplierStats, ConsumerStats} from "src/BoutTracker.sol";
import {BoutNFT} from "src/BoutNFT.sol";
import {DeployBoutSystem} from "script/DeployBoutSystem.s.sol";

contract BoutTrackerTest is Test {
    event PackageCreated(uint256 indexed tokenId, address indexed supplier, uint256 bottleCount, string packageLink);
    event SupplierRegistered(address indexed addressSupplier);
    event ConsumerRegistered(address indexed addressConsumer);
    event UserRoleRevoked(address indexed user, UserRole oldRole);
    event PackageReceived(uint256 indexed tokenId, address indexed consumer, address indexed supplier);
    event BottlesReturnedPending(
        uint256 indexed tokenId,
        address indexed consumer,
        address indexed supplier,
        uint256 pendingConsumerReward,
        uint256 pendingSupplierBonus
    );
    event RewardsAllocated(
        uint256 indexed tokenId,
        address indexed consumer,
        uint256 consumerReward,
        address indexed supplier,
        uint256 supplierBonus
    );
    event RewardsWithdrawn(address indexed user, uint256 amount);
    event RewardPerBottleUpdated(uint256 oldReward, uint256 newReward);
    event SupplierBonusRateUpdated(uint256 oldRate, uint256 newRate);

    BoutTracker boutTracker;
    BoutNFT boutNFT;
    address USER = makeAddr("user");
    address owner = makeAddr("owner");
    address consumer = makeAddr("consumer");
    uint256 constant BOTTLECOUNT_INITIAL = 6;
    string constant DEFAULT_LINK = "https://www.alyra.fr";
    uint256 public constant DEFAULT_REWARD_PER_BOTTLE = 10 * 1e18;
    uint256 public constant DEFAULT_SUPPLIER_BONUS_RATE = 10;

    function setUp() external {
        DeployBoutSystem deployBoutSystem = new DeployBoutSystem();
        DeployBoutSystem.DeployedContracts memory deployed = deployBoutSystem.run();

        boutTracker = deployed.boutTracker;
        boutNFT = deployed.boutNFT;
        owner = boutTracker.owner();
        console.log("Owner address:", owner);
        console.log("Test address:", address(this));
        console.log("msg.sender:", msg.sender);
    }

    //TEST REGISTER

    function testRegisterAsSupplier() public {
        vm.prank(USER);
        boutTracker.registerAsSupplier();
        assertEq(boutTracker.isRegistered(USER), true);
        assertEq(boutTracker.isSupplier(USER), true);
        assertEq(boutTracker.isConsumer(USER), false);
    }

    function testRegisterAsSupplierEmitsEvent() public {
        vm.expectEmit(true, false, false, false, address(boutTracker));
        emit SupplierRegistered(USER);
        vm.prank(USER);
        boutTracker.registerAsSupplier();
    }

    function testRegisterAsConsumer() public {
        vm.prank(USER);
        boutTracker.registerAsConsumer();
        assertEq(boutTracker.isRegistered(USER), true);
        assertEq(boutTracker.isConsumer(USER), true);
        assertEq(boutTracker.isSupplier(USER), false);
    }

    function testRegisterAsConsumerEmitsEvent() public {
        vm.expectEmit(true, false, false, false, address(boutTracker));
        emit ConsumerRegistered(USER);
        vm.prank(USER);
        boutTracker.registerAsConsumer();
    }

    function testCantRegisterTwice() public {
        vm.startPrank(USER);
        boutTracker.registerAsConsumer();
        vm.expectRevert(BoutTracker.BoutTracker__UserAlreadyRegistered.selector);
        boutTracker.registerAsSupplier();
        vm.stopPrank();
    }

    function testRevokeUserRole() public {
        vm.prank(USER);
        boutTracker.registerAsSupplier();
        vm.prank(owner);
        boutTracker.revokeUserRole(USER);
        assertEq(uint256(boutTracker.getUserRole(USER)), uint256(UserRole.NONE));
    }

    function testRevokeUserRoleEmitsEvent() public {
        vm.prank(USER);
        boutTracker.registerAsSupplier();

        vm.expectEmit(true, false, false, true, address(boutTracker));
        emit UserRoleRevoked(USER, UserRole.SUPPLIER);
        vm.prank(owner);
        boutTracker.revokeUserRole(USER);
    }

    //TEST CREATE PACKAGE

    function testSupplierCanCreatePackage() public {
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
        assertEq(boutNFT.balanceOf(USER), 1);
    }

    function testCreatePackageEmitsEvent() public {
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        vm.expectEmit(true, true, true, true, address(boutTracker));
        emit PackageCreated(1, USER, BOTTLECOUNT_INITIAL, DEFAULT_LINK);
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
    }

    function testConsumerCantCreatePackage() public {
        vm.startPrank(USER);
        boutTracker.registerAsConsumer();
        vm.expectRevert(BoutTracker.BoutTracker__OnlySupplierCanAccessFunction.selector);
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
    }

    function testCantCreatePackageWithZeroBottles() public {
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        vm.expectRevert(BoutTracker.BoutTracker__BottleCountIncorrect.selector);
        boutTracker.createPackage(0, DEFAULT_LINK, consumer);
        vm.stopPrank();
    }

    function testCantCreatePackageWithEmptyLink() public {
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        vm.expectRevert(BoutTracker.BoutTracker__PackageLinkEmpty.selector);
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, "", consumer);
        vm.stopPrank();
    }

    function testCantCreatePackageIfAddressConsumerEqualZero() public {
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        vm.expectRevert(BoutTracker.BoutTracker__IntendedConsumerCannotBeZero.selector);
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, address(0));
        vm.stopPrank();
    }

    function testCantCreatePackageIfConsumerNotRegistered() public {
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        vm.expectRevert(BoutTracker.BoutTracker__ConsumerAssignedIsNotRegistered.selector);
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
    }

    function testCantCreateDuplicatePackageLink() public {
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

    modifier PackageSentWithUserToConsumer() {
        vm.prank(consumer);
        boutTracker.registerAsConsumer();
        vm.startPrank(USER);
        boutTracker.registerAsSupplier();
        boutTracker.createPackage(BOTTLECOUNT_INITIAL, DEFAULT_LINK, consumer);
        vm.stopPrank();
        _;
    }

    function testConsumerCanReceivePackage() public PackageSentWithUserToConsumer {
        vm.prank(consumer);
        boutTracker.receivePackage(DEFAULT_LINK);
        assertEq(boutNFT.balanceOf(consumer), 1);
        assertEq(uint256(boutNFT.getPackageStatus(1)), uint256(BoutNFT.PackageStatus.RECEIVED));
    }

    function testReceivePackageEmitsEvent() public PackageSentWithUserToConsumer {
        vm.expectEmit(true, true, true, false, address(boutTracker));
        emit PackageReceived(1, consumer, USER);
        vm.prank(consumer);
        boutTracker.receivePackage(DEFAULT_LINK);
    }

    function testCantReceiveNonExistentPackage() public PackageSentWithUserToConsumer {
        vm.prank(consumer);
        vm.expectRevert(BoutTracker.BootTracker__PackageLinkDoesntExist.selector);
        boutTracker.receivePackage("");
    }

    function testCantReceiveAlreadyReceivedPackage() public PackageSentWithUserToConsumer {
        vm.startPrank(consumer);
        boutTracker.receivePackage(DEFAULT_LINK);
        vm.expectRevert(BoutTracker.BootTracker__PackageNotAvailable.selector);
        boutTracker.receivePackage(DEFAULT_LINK);
        vm.stopPrank();
    }

    function testCantReceiveOtherConsumerPackage() public PackageSentWithUserToConsumer {
        address consumer2 = makeAddr("consumer2");
        vm.prank(consumer2);
        vm.expectRevert(BoutTracker.BoutTracker__NotIntendedConsumer.selector);
        boutTracker.receivePackage(DEFAULT_LINK);
    }

    //RETURN BOTTLES

    modifier PackageReceivedByConsumer() {
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

    function testConsumerCanReturnBottles() public PackageReceivedByConsumer {
        vm.prank(consumer);
        boutTracker.returnBottles(1, BOTTLECOUNT_INITIAL - 1);
        assertEq(boutNFT.getPackage(1).returnedCount, BOTTLECOUNT_INITIAL - 1);
        assertEq(uint256(boutNFT.getPackageStatus(1)), uint256(BoutNFT.PackageStatus.RETURNED));
    }

    function testReturnBottlesEmitsEvent() public PackageReceivedByConsumer {
        uint256 returnedCount = BOTTLECOUNT_INITIAL - 1;
        uint256 consumerReward = DEFAULT_REWARD_PER_BOTTLE * returnedCount;
        uint256 supplierBonus = (consumerReward * DEFAULT_SUPPLIER_BONUS_RATE) / 100;

        vm.expectEmit(true, true, true, true, address(boutTracker));
        emit BottlesReturnedPending(1, consumer, USER, consumerReward, supplierBonus);
        vm.prank(consumer);
        boutTracker.returnBottles(1, returnedCount);
    }

    function testCantReturnBottlesIfNotReceived() public PackageSentWithUserToConsumer {
        vm.prank(consumer);
        vm.expectRevert(BoutTracker.BootTracker__PackageNotReceived.selector);
        boutTracker.returnBottles(1, BOTTLECOUNT_INITIAL - 1);
    }

    function testCantReturnZeroBottles() public PackageReceivedByConsumer {
        vm.prank(consumer);
        vm.expectRevert(BoutTracker.BootTracker__MustReturnOneBottle.selector);
        boutTracker.returnBottles(1, 0);
    }

    function testCantReturnMoreBottlesThanReceived() public PackageReceivedByConsumer {
        vm.prank(consumer);
        vm.expectRevert(BoutTracker.BootTracker__CantReturnMoreThanReceived.selector);
        boutTracker.returnBottles(1, BOTTLECOUNT_INITIAL + 1);
    }

    function testOnlyAssignedConsumerCanReturnBottles() public PackageReceivedByConsumer {
        address consumer2 = makeAddr("consumer2");
        vm.prank(consumer2);
        vm.expectRevert(BoutTracker.BoutTracker__NotIntendedConsumer.selector);
        boutTracker.returnBottles(1, BOTTLECOUNT_INITIAL - 1);
    }

    function testReturnBottlesCreatePendingRewards() public PackageReceivedByConsumer {
        vm.prank(consumer);
        boutTracker.returnBottles(1, BOTTLECOUNT_INITIAL - 1);
        uint256 consumerReward = boutTracker.getRewardPerBottleReturned() * (BOTTLECOUNT_INITIAL - 1);
        uint256 supplierBonus = (consumerReward * boutTracker.getSupplierBonusRate()) / 100;

        assertEq(boutTracker.getPendingRewards(1).consumerReward, consumerReward);
        assertEq(boutTracker.getPendingRewards(1).supplierBonus, supplierBonus);
    }

    function testFuzzPendingCalculatesCorrectAmounts(uint256 bottleCount) public PackageReceivedByConsumer {
        vm.assume(bottleCount > 0 && bottleCount <= BOTTLECOUNT_INITIAL);
        vm.prank(consumer);
        boutTracker.returnBottles(1, bottleCount);

        uint256 consumerReward = boutTracker.getRewardPerBottleReturned() * bottleCount;
        uint256 supplierBonus = (consumerReward * boutTracker.getSupplierBonusRate()) / 100;

        assertEq(boutTracker.getPendingRewards(1).consumerReward, consumerReward);
        assertEq(boutTracker.getPendingRewards(1).supplierBonus, supplierBonus);
    }

    //CONFIRM RETURN

    modifier PackageReturnedByConsumer() {
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

    function testSupplierCanConfirmReturn() public PackageReturnedByConsumer {
        vm.prank(USER);
        boutTracker.confirmReturn(1);
        assertEq(uint256(boutNFT.getPackageStatus(1)), uint256(BoutNFT.PackageStatus.CONFIRMED));
        assertEq(
            uint256(boutTracker.getWithdrawableRewards(consumer)),
            uint256(boutTracker.getPendingRewards(1).consumerReward)
        );
        assertEq(
            uint256(boutTracker.getWithdrawableRewards(USER)), uint256(boutTracker.getPendingRewards(1).supplierBonus)
        );
    }

    function testConfirmReturnEmitsEvent() public PackageReturnedByConsumer {
        uint256 returnedCount = BOTTLECOUNT_INITIAL - 1;
        uint256 consumerReward = DEFAULT_REWARD_PER_BOTTLE * returnedCount;
        uint256 supplierBonus = (consumerReward * DEFAULT_SUPPLIER_BONUS_RATE) / 100;

        vm.expectEmit(true, true, true, true, address(boutTracker));
        emit RewardsAllocated(1, consumer, consumerReward, USER, supplierBonus);
        vm.prank(USER);
        boutTracker.confirmReturn(1);
    }

    function testCantConfirmReturnIfNotReturned() public PackageReceivedByConsumer {
        vm.prank(USER);
        vm.expectRevert(BoutTracker.BootTracker__PackageNotInReturnedState.selector);
        boutTracker.confirmReturn(1);
    }

    function testCantConfirmReturnIfNoPendingReward() public PackageReturnedByConsumer {
        vm.prank(USER);
    }

    //WITHDRAW REWARDS

    modifier PackageConfirmedBySupplier() {
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
        vm.prank(USER);
        boutTracker.confirmReturn(1);
        _;
    }

    function testCanWithdrawRewardsAsConsumer() public PackageConfirmedBySupplier {
        assertEq(boutTracker.getWithdrawableRewards(consumer), DEFAULT_REWARD_PER_BOTTLE * (BOTTLECOUNT_INITIAL - 1));
        vm.prank(consumer);
        boutTracker.withdrawRewards();
        assertEq(boutTracker.getWithdrawableRewards(consumer), 0);
    }

    function testWithdrawRewardsEmitsEvent() public PackageConfirmedBySupplier {
        uint256 expectedAmount = DEFAULT_REWARD_PER_BOTTLE * (BOTTLECOUNT_INITIAL - 1);

        vm.expectEmit(true, false, false, true, address(boutTracker));
        emit RewardsWithdrawn(consumer, expectedAmount);
        vm.prank(consumer);
        boutTracker.withdrawRewards();
    }

    function testCanWithdrawRewardsAsSupplier() public PackageConfirmedBySupplier {
        assertEq(
            boutTracker.getWithdrawableRewards(USER),
            (DEFAULT_REWARD_PER_BOTTLE * (BOTTLECOUNT_INITIAL - 1)) * DEFAULT_SUPPLIER_BONUS_RATE / 100
        );
        vm.prank(USER);
        boutTracker.withdrawRewards();
        assertEq(boutTracker.getWithdrawableRewards(USER), 0);
    }

    function testWithdrawRewardsEmitsEventForSupplier() public PackageConfirmedBySupplier {
        uint256 expectedAmount =
            (DEFAULT_REWARD_PER_BOTTLE * (BOTTLECOUNT_INITIAL - 1) * DEFAULT_SUPPLIER_BONUS_RATE) / 100;

        vm.expectEmit(true, false, false, true, address(boutTracker));
        emit RewardsWithdrawn(USER, expectedAmount);
        vm.prank(USER);
        boutTracker.withdrawRewards();
    }

    function testCantWithdrawRewardsIfNoRewardsToWithdraw() public PackageConfirmedBySupplier {
        vm.prank(consumer);
        boutTracker.withdrawRewards();
        vm.expectRevert(BoutTracker.BoutTracker__NoRewardsToWithdraw.selector);
        boutTracker.withdrawRewards();
    }

    function testCantWithdrawWithNoRewards() public {
        vm.prank(USER);
        vm.expectRevert(BoutTracker.BoutTracker__NoRewardsToWithdraw.selector);
        boutTracker.withdrawRewards();
    }

    function testWithdrawRewardsResetsBalance() public PackageConfirmedBySupplier {
        uint256 balanceBefore = boutTracker.getWithdrawableRewards(consumer);
        assertTrue(balanceBefore > 0);

        vm.prank(consumer);
        boutTracker.withdrawRewards();

        assertEq(boutTracker.getWithdrawableRewards(consumer), 0);
    }

    //ADMIN FUNCTION
    function testSetRewardPerBottle() public {
        uint256 newReward = 20 * 1e18;
        vm.prank(owner);
        boutTracker.setRewardPerBottle(newReward);
        assertEq(boutTracker.getRewardPerBottleReturned(), newReward);
    }

    function testOnlyOwnerCanSetRewardPerBottle() public {
        vm.prank(USER);
        vm.expectRevert();
        boutTracker.setRewardPerBottle(20 * 1e18);
    }

    function testSetSupplierBonusRate() public {
        uint256 newRate = 15;
        vm.prank(owner);
        boutTracker.setSupplierBonusRate(newRate);
        assertEq(boutTracker.getSupplierBonusRate(), newRate);
    }

    function testCantSetSupplierBonusRateAbove100() public {
        vm.prank(owner);
        vm.expectRevert(BoutTracker.BoutTracker__BonusRateCantExceed100.selector);
        boutTracker.setSupplierBonusRate(101);
    }

    function testGlobalStatsInitialState() public view {
        (uint256 totalPackages, uint256 totalBottles, uint256 totalReturned, uint256 totalRewards, uint256 returnRate) =
            boutTracker.getGlobalStats();
        assertEq(totalPackages, 0);
        assertEq(totalBottles, 0);
        assertEq(totalReturned, 0);
        assertEq(totalRewards, 0);
        assertEq(returnRate, 0);
    }

    function testGlobalStatsAfterFullWorkflow() public PackageConfirmedBySupplier {
        (uint256 totalPackages, uint256 totalBottles, uint256 totalReturned, uint256 totalRewards, uint256 returnRate) =
            boutTracker.getGlobalStats();

        assertEq(totalPackages, 1);
        assertEq(totalBottles, BOTTLECOUNT_INITIAL);
        assertEq(totalReturned, BOTTLECOUNT_INITIAL - 1);
        assertTrue(returnRate > 0);
    }

    function testSupplierStatsUpdate() public PackageConfirmedBySupplier {
        SupplierStats memory stats = boutTracker.getSupplierStats(USER);
        assertEq(stats.totalPackageSent, 1);
        assertEq(stats.totalBottlesSent, BOTTLECOUNT_INITIAL);
        assertEq(stats.totalBottlesReturned, BOTTLECOUNT_INITIAL - 1);
        assertTrue(stats.totalRewardsEarned > 0);
    }

    function testConsumerStatsUpdate() public PackageConfirmedBySupplier {
        ConsumerStats memory stats = boutTracker.getConsumerStats(consumer);
        assertEq(stats.totalPackagesReceived, 1);
        assertEq(stats.totalBottlesReceived, BOTTLECOUNT_INITIAL);
        assertEq(stats.totalBottlesReturned, BOTTLECOUNT_INITIAL - 1);
        assertTrue(stats.totalRewardsEarned > 0);
    }

    //GETTERS

    function testHasUnclaimedRewards() public PackageReturnedByConsumer {
        assertTrue(boutTracker.hasUnclaimedRewards(1));
    }

    function testHasUnclaimedRewardsAfterConfirm() public PackageConfirmedBySupplier {
        assertFalse(boutTracker.hasUnclaimedRewards(1));
    }

    function testTokenExists() public PackageSentWithUserToConsumer {
        assertTrue(boutTracker.tokenExists(1));
        assertFalse(boutTracker.tokenExists(999));
    }

    function testGetTokenIdByLink() public PackageSentWithUserToConsumer {
        assertEq(boutTracker.getTokenIdByLink(DEFAULT_LINK), 1);
        assertEq(boutTracker.getTokenIdByLink("nonexistent"), 0);
    }
}
