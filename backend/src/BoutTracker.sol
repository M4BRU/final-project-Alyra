// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {BoutNFT} from "./BoutNFT.sol";
import {BoutToken} from "./BoutToken.sol";

enum UserRole{
    NONE,
    SUPPLIER,
    CONSUMER,
    ADMIN
}

struct SupplierStats{
        uint256 totalPackageSent;
        uint256 totalBottlesSent;
        uint256 totalBottlesReturned;
        uint256 totalRewardsEarned;
    }

    struct ConsumerStats {
        uint256 totalPackagesReceived;
        uint256 totalBottlesReceived;
        uint256 totalBottlesReturned;
        uint256 totalRewardsEarned;
    }

    struct PendingRewards{
        uint256 consumerReward;
        uint256 supplierBonus;
        bool claimed;
    }

contract BoutTracker is Ownable, ReentrancyGuard{

    event SupplierRegistered(address indexed addressSupplier);
    event ConsumerRegistered(address indexed addressConsumer);
    event UserRoleRevoked(address indexed user, UserRole oldRole);
    event PackageCreated(uint256 indexed tokenId, address indexed supplier, uint256 bottleCount, string packageLink);
    event PackageReceived(uint256 indexed tokenId, address indexed consumer, address indexed supplier);
    event BottlesReturned(uint256 indexed tokenId, address indexed consumer, address indexed supplier, uint256 returnedCount, uint256 consumerReward, uint256 supplierBonus);
    event ReturnConfirmed(uint256 indexed tokenId, address indexed supplier,address indexed consumer, uint256 returnedCount);
    event BottlesReturnedPending(uint256 indexed tokenId, address indexed consumer, address indexed supplier, uint256 pendingConsumerReward, uint256 pendingSupplierBonus);
    event RewardsDistributed(uint256 indexed tokenId, address indexed consumer, uint256 consumerReward, address indexed supplier, uint256 supplierBonus);
    event RewardsAllocated(uint256 indexed tokenId, address indexed consumer, uint256 consumerReward, address indexed supplier, uint256 supplierBonus);
    event RewardsWithdrawn(address indexed user, uint256 amount);
    event RewardPerBottleUpdated(uint256  oldReward, uint256  newReward);
    event SupplierBonusRateUpdated(uint256 oldRate, uint256 newRate);
    event EmergencyStatusUpdate(uint256 indexed tokenId, BoutNFT.PackageStatus status);
    event MaliciousSupplierBanned(address indexed supplier, uint256 packagesBanned, string reason);

    error BoutTracker__BootNFTAddressCantBeZero();
    error BoutTracker__BootTokenAddressCantBeZero();
    error BoutTracker__OnlySupplierCanAccessFunction();
    error BoutTracker__OnlyConsumerCanAccessFunction();
    error BoutTracker__OnlyRegisteredUserCanAccessFunction();
    error BoutTracker__OnlyAssignedSupplierCanAccessFunction();
    error BoutTracker__UserAlreadyRegistered();
    error BoutTracker__BottleCountIncorrect();
    error BoutTracker__PackageLinkEmpty();
    error BoutTracker__PackageLinkAlreadyExist();
    error BootTracker__TokenDoesntExist();
    error BootTracker__PackageLinkDoesntExist();
    error BootTracker__PackageNotAvailable();
    error BootTracker__PackageAlreadyClaimed();
    error BootTracker__PackageNotReceived();
    error BootTracker__MustReturnOneBottle();
    error BootTracker__CantReturnMoreThanReceived();
    error BootTracker__PackageNotInReturnedState();
    error BoutTracker__RewardsAlreadyClaimed();
    error BoutTracker__NoPendingRewards();
    error BoutTracker__NoRewardsToWithdraw();
    error BoutTracker__BonusRateCantExceed100();
    error BoutTracker__NotIntendedConsumer();
    error BoutTracker__IntendedConsumerCannotBeZero();
    error BoutTracker__PackageIsBanned();
    error BoutTracker__ConsumerAssignedIsNotRegistered();

    BoutNFT private immutable i_boutNFT;
    BoutToken private immutable i_boutToken;
    uint256 private s_rewardPerBottleReturned  = 10 * 1e18;
    uint256 private s_supplierBonusRate = 10;

    mapping(address => UserRole) private s_userRoles;

    mapping(address => SupplierStats) private s_supplierStats;
    mapping(address => ConsumerStats) private s_consumerStats;

    mapping(string => uint256) private s_linkToTokenId;
    mapping(uint256 => bool) private s_tokenExists;

// ========== PULL REWARDS SYSTEM ==========
    mapping(address => uint256) private s_withdrawableRewards;

// ========== ESCROW REWARDS MANAGEMENT ==========
    mapping(uint256 => PendingRewards) private s_pendingRewards;

    uint256 private s_totalPackagesCreated;
    uint256 private s_totalBottlesInCirculation;
    uint256 private s_totalBottlesReturned;
    uint256 private s_totalRewardsDistributed;


    constructor(address _boutNFT, address _boutToken) Ownable(msg.sender){
        if(_boutNFT == address(0)){
            revert BoutTracker__BootNFTAddressCantBeZero();
        }
        if(_boutToken == address(0)){
            revert BoutTracker__BootTokenAddressCantBeZero();
        }

        i_boutNFT = BoutNFT(_boutNFT);
        i_boutToken = BoutToken(_boutToken);
    }

    modifier onlySupplier(){
        if(s_userRoles[msg.sender] != UserRole.SUPPLIER){
            revert BoutTracker__OnlySupplierCanAccessFunction();
        }
        _;
    }

    modifier onlyConsumer(){
        if(s_userRoles[msg.sender] != UserRole.CONSUMER){
            revert BoutTracker__OnlyConsumerCanAccessFunction();
        }
        _;
    }

    modifier onlyRegisteredUser(){
        if(s_userRoles[msg.sender] == UserRole.NONE){
            revert BoutTracker__OnlyRegisteredUserCanAccessFunction();
        }
        _;
    }

// ========== USER REGISTRATION ==========

    function registerAsSupplier() external{
        if(s_userRoles[msg.sender] != UserRole.NONE){
            revert BoutTracker__UserAlreadyRegistered();
        }

        s_userRoles[msg.sender] = UserRole.SUPPLIER;

        emit SupplierRegistered(msg.sender);
    }

    function registerAsConsumer() external{
        if(s_userRoles[msg.sender] != UserRole.NONE){
            revert BoutTracker__UserAlreadyRegistered();
        }

        s_userRoles[msg.sender] = UserRole.CONSUMER;

        emit ConsumerRegistered(msg.sender);
    }

    function revokeUserRole(address user) external onlyOwner{
        UserRole oldRole = s_userRoles[user];
        s_userRoles[user] = UserRole.NONE;

        emit UserRoleRevoked(user, oldRole);
    }

// ========== SUPPLIER FUNCTIONS ==========

    function createPackage(uint256 bottleCount, string memory packageLink, address intendedConsumer) external onlySupplier returns(uint256){
        if(bottleCount <= 0){
            revert BoutTracker__BottleCountIncorrect();
        }
        if(bytes(packageLink).length <= 0){
            revert BoutTracker__PackageLinkEmpty();
        }
        if(intendedConsumer == address(0)){
            revert BoutTracker__IntendedConsumerCannotBeZero();
        }
        if(s_linkToTokenId[packageLink] != 0){
            revert BoutTracker__PackageLinkAlreadyExist();
        }
        if(s_userRoles[intendedConsumer] != UserRole.CONSUMER){
            revert BoutTracker__ConsumerAssignedIsNotRegistered();
        }

        uint256 tokenId = i_boutNFT.createPackage(
            msg.sender,
            bottleCount,
            packageLink,
            intendedConsumer
        );

        s_linkToTokenId[packageLink] = tokenId;
        s_tokenExists[tokenId] = true;

        SupplierStats storage stats = s_supplierStats[msg.sender];
        stats.totalPackageSent++;
        stats.totalBottlesSent += bottleCount;

        s_totalPackagesCreated++;
        s_totalBottlesInCirculation += bottleCount;

        emit PackageCreated(tokenId, msg.sender, bottleCount, packageLink);

        return tokenId;
    }


// ========== CONSUMER FUNCTIONS ==========

    function receivePackage(string memory packageLink) external{
        uint256 tokenId = s_linkToTokenId[packageLink];
        if(tokenId == 0){
            revert BootTracker__PackageLinkDoesntExist();
        }

        if(i_boutNFT.getPackageStatus(tokenId) != BoutNFT.PackageStatus.SENT){
            revert BootTracker__PackageNotAvailable();
        }

        BoutNFT.Package memory pkg = i_boutNFT.getPackage(tokenId);
        if(pkg.consumer != msg.sender){
            revert BoutTracker__NotIntendedConsumer();
        }

        i_boutNFT.transferFrom(pkg.sender, msg.sender, tokenId);

        i_boutNFT.updateStatus(tokenId, BoutNFT.PackageStatus.RECEIVED);

        ConsumerStats storage stats = s_consumerStats[msg.sender];
        stats.totalPackagesReceived++;
        stats.totalBottlesReceived += pkg.bottleCount;

        emit PackageReceived(tokenId, msg.sender, pkg.sender);
    }

    function returnBottles(uint256 tokenId, uint256 returnedCount) external{
        BoutNFT.Package memory pkg = i_boutNFT.getPackage(tokenId);
        if(pkg.consumer != msg.sender){
            revert BoutTracker__NotIntendedConsumer();
        }
        
        if(!s_tokenExists[tokenId]){
            revert BootTracker__TokenDoesntExist();
        }
        
        if(pkg.status != BoutNFT.PackageStatus.RECEIVED){
            revert BootTracker__PackageNotReceived();
        }
        if(returnedCount <= 0){
            revert BootTracker__MustReturnOneBottle();
        }
        if(returnedCount > pkg.bottleCount){
            revert BootTracker__CantReturnMoreThanReceived();
        }

        i_boutNFT.transferFrom(msg.sender, pkg.sender, tokenId);

        uint256 consumerReward = returnedCount * s_rewardPerBottleReturned;
        uint256 supplierBonus = (consumerReward * s_supplierBonusRate) /100;//A REVOIR

        s_pendingRewards[tokenId] = PendingRewards({
            consumerReward: consumerReward,
            supplierBonus: supplierBonus,
            claimed: false
        });


        i_boutNFT.setReturnedCount(tokenId, returnedCount);
        i_boutNFT.updateStatus(tokenId, BoutNFT.PackageStatus.RETURNED);

        _updateReturnStatsWithoutRewards(pkg.sender, msg.sender, returnedCount);

        emit BottlesReturnedPending(tokenId, msg.sender, pkg.sender, consumerReward, supplierBonus);    
        
    }

   

    function confirmReturn(uint256 tokenId) external {
        BoutNFT.Package memory pkg = i_boutNFT.getPackage(tokenId);
        if(pkg.sender != msg.sender){
            revert BoutTracker__OnlyAssignedSupplierCanAccessFunction();
        }
        
        if(!s_tokenExists[tokenId]){
            revert BootTracker__TokenDoesntExist();
        }

        if(pkg.status != BoutNFT.PackageStatus.RETURNED){
            revert BootTracker__PackageNotInReturnedState();
        }

        PendingRewards storage rewards = s_pendingRewards[tokenId];
        if(rewards.claimed){
            revert BoutTracker__RewardsAlreadyClaimed();
        }
        if(rewards.consumerReward <= 0){
            revert BoutTracker__NoPendingRewards();
        }
        s_withdrawableRewards[pkg.consumer] += rewards.consumerReward;
        s_withdrawableRewards[pkg.sender] += rewards.supplierBonus;

        rewards.claimed = true;

        _updateRewardStats(pkg.sender, pkg.consumer, rewards.consumerReward, rewards.supplierBonus);

        s_totalRewardsDistributed += (rewards.consumerReward + rewards.supplierBonus);

        i_boutNFT.updateStatus(tokenId, BoutNFT.PackageStatus.CONFIRMED);

        emit RewardsAllocated(tokenId, pkg.consumer, rewards.consumerReward, pkg.sender, rewards.supplierBonus);
    }

    function withdrawRewards() external nonReentrant{
        uint256 amount = s_withdrawableRewards[msg.sender];
        if(amount <= 0){
            revert BoutTracker__NoRewardsToWithdraw();
        }

        s_withdrawableRewards[msg.sender] = 0;
        i_boutToken.mint(msg.sender, amount);

        emit RewardsWithdrawn(msg.sender, amount);
    }



    function _updateReturnStatsWithoutRewards(address supplier, address consumer, uint256 returnedCount) private{
        ConsumerStats storage cStats = s_consumerStats[consumer];
        cStats.totalBottlesReturned += returnedCount;

        SupplierStats storage sStats = s_supplierStats[supplier];
        sStats.totalBottlesReturned += returnedCount;

        s_totalBottlesReturned += returnedCount;
    }

    function _updateRewardStats(address supplier, address consumer, uint256 consumerReward, uint256 supplierBonus) private{
        s_consumerStats[consumer].totalRewardsEarned += consumerReward;
        s_supplierStats[supplier].totalRewardsEarned += supplierBonus;
    }

// ========== ADMIN FUNCTIONS ==========

    function setRewardPerBottle(uint256 _rewardPerBottle) external onlyOwner{
        uint256 oldReward = s_rewardPerBottleReturned;
        s_rewardPerBottleReturned = _rewardPerBottle;
        emit RewardPerBottleUpdated(oldReward, _rewardPerBottle);//plus tard DAO ?
    }

    function setSupplierBonusRate(uint256 _bonusRate) external onlyOwner{
        if(_bonusRate > 100){
            revert BoutTracker__BonusRateCantExceed100();
        }
        uint256 oldRate = s_supplierBonusRate;
        s_supplierBonusRate = _bonusRate;
        emit SupplierBonusRateUpdated(oldRate, _bonusRate);
    }

    function emergencyUpdateStatus(uint256 tokenId, BoutNFT.PackageStatus status) external onlyOwner{
        if(!s_tokenExists[tokenId]){
            revert BootTracker__TokenDoesntExist();
        }

        i_boutNFT.updateStatus(tokenId, status);

        emit EmergencyStatusUpdate(tokenId, status);
    }

    function banSupplierPackages(address maliciousSupplier, string memory reason) external onlyOwner{
        uint256[]memory activePackages = i_boutNFT.getActiveSupplierPackages(maliciousSupplier);

        for(uint256 i = 0; i < activePackages.length; i++){
            i_boutNFT.banPackage(activePackages[i], reason);
        }

        emit MaliciousSupplierBanned(maliciousSupplier, activePackages.length, reason);
    }




    function getGlobalStats() external view returns (
        uint256 totalPackages,
        uint256 totalBottlesCirculation,
        uint256 totalBottlesReturned,
        uint256 totalRewards,
        uint256 globalReturnRate
    ) {
        totalPackages = s_totalPackagesCreated;
        totalBottlesCirculation = s_totalBottlesInCirculation;
        totalBottlesReturned = s_totalBottlesReturned;
        totalRewards = s_totalRewardsDistributed;
    
        // Taux de retour global
        if (s_totalBottlesInCirculation > 0) {
            globalReturnRate = (s_totalBottlesReturned * 100) / s_totalBottlesInCirculation;
        }
    }


    function getPendingRewards(uint256 tokenId) external view returns (PendingRewards memory) {
        return s_pendingRewards[tokenId];
    }



    function hasUnclaimedRewards(uint256 tokenId) external view returns (bool) {
        if (!s_tokenExists[tokenId]) return false;
    
        PendingRewards memory rewards = s_pendingRewards[tokenId];
        return !rewards.claimed && rewards.consumerReward > 0;
    }



// ========== ROLE GETTERS ==========
function getUserRole(address user) external view returns (UserRole) {
    return s_userRoles[user];
}

function isSupplier(address user) external view returns (bool) {
    return s_userRoles[user] == UserRole.SUPPLIER;
}

function isConsumer(address user) external view returns (bool) {
    return s_userRoles[user] == UserRole.CONSUMER;
}

function isRegistered(address user) external view returns (bool) {
    return s_userRoles[user] != UserRole.NONE;
}







// ========== WITHDRAW GETTERS ==========
function getWithdrawableRewards(address user) external view returns (uint256) {
    return s_withdrawableRewards[user];
}

function getMyWithdrawableRewards() external view returns (uint256) {
    return s_withdrawableRewards[msg.sender];
}

function hasWithdrawableRewards(address user) external view returns (bool) {
    return s_withdrawableRewards[user] > 0;
}




// ========== GETTERS FOR CONTRACTS ==========
    function getBoutNFT() external view returns (address) {
        return address(i_boutNFT);
    }

    function getBoutToken() external view returns (address) {
        return address(i_boutToken);
    }

// ========== GETTERS FOR CONFIGURATION ==========
    function getRewardPerBottleReturned() external view returns (uint256) {
        return s_rewardPerBottleReturned;
    }

    function getSupplierBonusRate() external view returns (uint256) {
        return s_supplierBonusRate;
    }

// ========== GETTERS FOR QR LINKS ==========
    function getTokenIdByLink(string memory packageLink) external view returns (uint256) {
        return s_linkToTokenId[packageLink];
    }

    function tokenExists(uint256 tokenId) external view returns (bool) {
        return s_tokenExists[tokenId];
    }

// ========== GETTERS FOR GLOBAL STATS ==========
    function getTotalPackagesCreated() external view returns (uint256) {
        return s_totalPackagesCreated;
    }

    function getTotalBottlesInCirculation() external view returns (uint256) {
        return s_totalBottlesInCirculation;
    }

    function getTotalBottlesReturned() external view returns (uint256) {
        return s_totalBottlesReturned;
    }

    function getTotalRewardsDistributed() external view returns (uint256) {
        return s_totalRewardsDistributed;
    }

// ========== GETTERS FOR USER STATS ==========
    function getSupplierStats(address supplier) external view returns (SupplierStats memory) {
        return s_supplierStats[supplier];
    }

    function getConsumerStats(address consumer) external view returns (ConsumerStats memory) {
        return s_consumerStats[consumer];
    }


}