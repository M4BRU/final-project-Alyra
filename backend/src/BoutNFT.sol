// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BoutToken} from "src/BoutToken.sol";

contract BoutNFT is ERC721, Ownable {
    error BoutNFT__AddressNotCorrect();
    error BoutNFT__NotConsumer();
    error BoutNFT__InvalidState();
    error BoutNFT__InvalidNumberOfBottle();
    error BoutToken__OnlyTrackerCanAccess();
    error BoutNFT__LinkEmpty();
    error BoutNFT__TokenNotExist();
    error BoutNFT__CantReturnedMoreThanSent();
    error BoutNFT__TooManyActivePackages();
    error BoutNFT__LimitTooHigh();
    error BoutNFT__AdminOverrideLimitExceeded();
    error BoutNFT__PackageIsBanned();

    event TrackerUpdated(address indexed oldTracker, address indexed newTracker);
    event PackageCreated(uint256 indexed tokenId, address indexed supplier, uint256 bottleCount, string packageLink);
    event StatusUpdated(uint256 indexed tokenId, PackageStatus oldStatus, PackageStatus status);
    event ConsumerAssigned(uint256 indexed tokenId, address indexed consumer);
    event ReturnedCountUpdated(uint256 indexed tokenId, uint256 count);
    event PackageArchived(uint256 indexed tokenId, address indexed supplier, address indexed consumer);
    event AdminLimitOverrideUsed(address indexed addressOverridden, uint256 newLimit, address indexed admin);
    event EmergencyPackageArchived(uint256 indexed tokenId, address indexed supplier, address indexed consumer);
    event PackageBanned(uint256 indexed tokenId, address indexed admin, string reason);
    event PackageUnbanned(uint256 indexed tokenId, address indexed admin);
    event PackageUnarchived(uint256 indexed tokenId, address indexed supplier, address indexed consumer);

    modifier onlyTracker() {
        if (msg.sender != tracker) {
            revert BoutToken__OnlyTrackerCanAccess();
        } else {
            _;
        }
    }

    enum PackageStatus {
        SENT,
        RECEIVED,
        RETURNED,
        CONFIRMED
    }

    struct Package {
        uint256 bottleCount;
        address sender;
        address consumer;
        uint256 createdAt;
        uint256 receivedAt;
        uint256 returnedAt;
        uint256 returnedCount;
        PackageStatus status;
        string packageLink;
        bool isBanned;
    }

    mapping(uint256 => Package) public packages;

    mapping(address => uint256[]) private s_supplierPackageIds;
    mapping(address => uint256[]) private s_consumerPackageIds;

    mapping(address => uint256[]) private s_activeSupplierPackages;
    mapping(address => uint256[]) private s_archivedSupplierPackages;
    mapping(address => uint256[]) private s_activeConsumerPackages;
    mapping(address => uint256[]) private s_archivedConsumerPackages;

    mapping(address => uint256) private s_supplierActiveCount;
    mapping(address => uint256) private s_supplierArchivedCount;
    mapping(address => uint256) private s_consumerActiveCount;
    mapping(address => uint256) private s_consumerArchivedCount;

    mapping(address => uint256) private s_adminLimitOverrides; // 0 = limite normale

    uint256 public constant MAX_ACTIVE_PACKAGES_PER_ADDRESS = 50; // Limite stricte anti-DoS
    uint256 public constant MAX_ACTIVE_PACKAGES_ADMIN_OVERRIDE = 200;

    BoutToken public boutToken;
    address private tracker;
    uint256 private nextTokenId = 1;

    constructor(address _tracker) ERC721("Bout Package", "BPKG") Ownable(msg.sender) {
        tracker = _tracker;
    }

    /**
     * @notice Checks if an operator is approved for all tokens of an owner
     * @param owner The token owner address
     * @param operator The potential operator address
     * @return true if operator is approved or is the tracker contract
     * @dev Automatically approves tracker for gas-free transfers in workflows
     */
    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        if (operator == tracker) return true;
        return super.isApprovedForAll(owner, operator);
    }

    /**
     * @notice Updates the BoutTracker contract address (admin function)
     * @param _tracker The new BoutTracker contract address
     * @dev Changes which contract can call onlyTracker functions
     * @custom:access onlyOwner
     * @custom:requirements Tracker address cannot be zero
     * @custom:emits TrackerUpdated
     */
    function setTracker(address _tracker) external onlyOwner {
        if (_tracker == address(0)) {
            revert BoutNFT__AddressNotCorrect();
        }
        address oldTracker = tracker;
        tracker = _tracker;

        emit TrackerUpdated(oldTracker, tracker);
    }

    /**
     * @notice Creates a new package NFT with unique bottle tracking
     * @param supplier The address of the supplier creating the package
     * @param bottleCount Number of bottles in the package (must be > 0)
     * @param packageLink Unique QR code link for package identification
     * @param _consumer The address of the consumer assigned to receive this package
     * @return tokenId The unique identifier of the created NFT package
     * @dev Mints ERC721 NFT, initializes package data, updates active counts
     * @custom:access onlyTracker (only BoutTracker can call this function)
     * @custom:requirements All addresses must be non-zero
     * @custom:requirements Supplier and consumer must not exceed active package limits
     * @custom:requirements Package link cannot be empty
     * @custom:emits PackageCreated
     */
    function createPackage(address supplier, uint256 bottleCount, string memory packageLink, address _consumer)
        external
        onlyTracker
        returns (uint256)
    {
        if (supplier == address(0)) {
            revert BoutNFT__AddressNotCorrect();
        }
        if (_consumer == address(0)) {
            revert BoutNFT__AddressNotCorrect();
        }
        if (bottleCount <= 0) {
            revert BoutNFT__InvalidNumberOfBottle();
        }
        if (bytes(packageLink).length <= 0) {
            revert BoutNFT__LinkEmpty();
        }

        uint256 supplierLimit = getAddressActiveLimit(supplier);
        uint256 consumerLimit = getAddressActiveLimit(_consumer);

        if (s_supplierActiveCount[supplier] >= supplierLimit) {
            revert BoutNFT__TooManyActivePackages();
        }
        if (s_consumerActiveCount[_consumer] >= consumerLimit) {
            revert BoutNFT__TooManyActivePackages();
        }

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        packages[tokenId] = Package({
            bottleCount: bottleCount,
            sender: supplier,
            consumer: _consumer,
            createdAt: block.timestamp,
            receivedAt: 0,
            returnedAt: 0,
            returnedCount: 0,
            status: PackageStatus.SENT,
            packageLink: packageLink,
            isBanned: false
        });

        s_supplierPackageIds[supplier].push(tokenId);
        s_consumerPackageIds[_consumer].push(tokenId);

        s_activeSupplierPackages[supplier].push(tokenId);
        s_activeConsumerPackages[_consumer].push(tokenId);
        s_supplierActiveCount[supplier]++;
        s_consumerActiveCount[_consumer]++;

        _safeMint(supplier, tokenId);

        emit PackageCreated(tokenId, supplier, bottleCount, packageLink);

        return tokenId;
    }

    /**
     * @notice Updates the status of a package through its lifecycle
     * @param tokenId The identifier of the package NFT to update
     * @param status The new status to set (SENT, RECEIVED, RETURNED, CONFIRMED)
     * @dev Automatically sets timestamps and archives package when CONFIRMED
     * @custom:access onlyTracker
     * @custom:requirements Token must exist
     * @custom:emits StatusUpdated, PackageArchived (if status is CONFIRMED)
     */
    function updateStatus(uint256 tokenId, PackageStatus status) external onlyTracker {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            revert BoutNFT__TokenNotExist();
        }

        Package storage pkg = packages[tokenId];
        PackageStatus oldStatus = pkg.status;

        pkg.status = status;

        if (status == PackageStatus.RECEIVED) {
            pkg.receivedAt = block.timestamp;
        } else if (status == PackageStatus.RETURNED) {
            pkg.returnedAt = block.timestamp;
        }

        if (status == PackageStatus.CONFIRMED && oldStatus != PackageStatus.CONFIRMED) {
            _archivePackage(tokenId, pkg.sender, pkg.consumer);
        }

        emit StatusUpdated(tokenId, oldStatus, status);
    }

    /**
     * @notice Sets a custom active package limit for a specific address
     * @param user The address to apply the custom limit to
     * @param customLimit The new limit (max 200, use 0 to reset to default 50)
     * @dev Admin override for special users, anti-DoS protection
     * @custom:access onlyOwner
     * @custom:requirements Custom limit must be ≤ 200
     * @custom:emits AdminLimitOverrideUsed
     */
    function setAddressActiveLimit(address user, uint256 customLimit) external onlyOwner {
        if (customLimit > MAX_ACTIVE_PACKAGES_ADMIN_OVERRIDE) {
            revert BoutNFT__AdminOverrideLimitExceeded();
        }
        s_adminLimitOverrides[user] = customLimit;
        emit AdminLimitOverrideUsed(user, customLimit, msg.sender);
    }

    /**
     * @notice Returns the active package limit for an address
     * @param user The address to check
     * @return The maximum number of active packages this address can have
     * @dev Returns custom admin override if set, otherwise default limit (50)
     */
    function getAddressActiveLimit(address user) public view returns (uint256) {
        uint256 customLimit = s_adminLimitOverrides[user];
        return customLimit > 0 ? customLimit : MAX_ACTIVE_PACKAGES_PER_ADDRESS;
    }

    /**
     * @notice Assigns or reassigns a consumer to a package
     * @param tokenId The identifier of the package NFT
     * @param consumer The new consumer address to assign
     * @dev Allows flexibility in package assignment before receipt
     * @custom:access onlyTracker
     * @custom:requirements Token must exist and consumer address non-zero
     * @custom:emits ConsumerAssigned
     */
    function setConsumer(uint256 tokenId, address consumer) external onlyTracker {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            revert BoutNFT__TokenNotExist();
        }
        if (consumer == address(0)) {
            revert BoutNFT__AddressNotCorrect();
        }

        packages[tokenId].consumer = consumer;
        emit ConsumerAssigned(tokenId, consumer);
    }

    /**
     * @notice Sets the number of bottles returned for a specific package
     * @param tokenId The identifier of the package NFT
     * @param count Number of bottles returned (must be ≤ original bottleCount)
     * @dev Used by BoutTracker when consumer declares bottle returns
     * @custom:access onlyTracker
     * @custom:requirements Token must exist
     * @custom:requirements Count cannot exceed original bottle count
     * @custom:emits ReturnedCountUpdated
     */
    function setReturnedCount(uint256 tokenId, uint256 count) external onlyTracker {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            revert BoutNFT__TokenNotExist();
        }
        if (count > packages[tokenId].bottleCount) {
            revert BoutNFT__CantReturnedMoreThanSent();
        }

        packages[tokenId].returnedCount = count;
        emit ReturnedCountUpdated(tokenId, count);
    }

    function _archivePackage(uint256 tokenId, address supplier, address consumer) private {
        _removeFromActiveArray(s_activeSupplierPackages[supplier], tokenId);
        _removeFromActiveArray(s_activeConsumerPackages[consumer], tokenId);

        s_archivedSupplierPackages[supplier].push(tokenId);
        s_archivedConsumerPackages[consumer].push(tokenId);

        s_supplierActiveCount[supplier]--;
        s_supplierArchivedCount[supplier]++;
        s_consumerActiveCount[consumer]--;
        s_consumerArchivedCount[consumer]++;

        emit PackageArchived(tokenId, supplier, consumer);
    }

    function _unarchivePackage(uint256 tokenId, address supplier, address consumer) private {
        _removeFromArchiveArray(s_archivedSupplierPackages[supplier], tokenId);
        _removeFromArchiveArray(s_archivedConsumerPackages[consumer], tokenId);

        s_activeSupplierPackages[supplier].push(tokenId);
        s_activeConsumerPackages[consumer].push(tokenId);

        s_supplierActiveCount[supplier]++;
        s_supplierArchivedCount[supplier]--;
        s_consumerActiveCount[consumer]++;
        s_consumerArchivedCount[consumer]--;

        emit PackageUnarchived(tokenId, supplier, consumer);
    }

    function _removeFromArchiveArray(uint256[] storage array, uint256 tokenId) private {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == tokenId) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    function _removeFromActiveArray(uint256[] storage array, uint256 tokenId) private {
        for (uint256 i = 0; i < array.length; i++) {
            if (array[i] == tokenId) {
                array[i] = array[array.length - 1];
                array.pop();
                break;
            }
        }
    }

    /**
     * @notice Bans a package, making it inactive and preventing interactions
     * @param tokenId The identifier of the package NFT to ban
     * @param reason Human-readable reason for the ban (for transparency)
     * @dev Archives the package if not already confirmed, prevents further use
     * @custom:access onlyTracker
     * @custom:requirements Token must exist
     * @custom:emits PackageBanned
     */
    function banPackage(uint256 tokenId, string memory reason) external onlyTracker {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            revert BoutNFT__TokenNotExist();
        }
        Package storage pkg = packages[tokenId];
        pkg.isBanned = true;

        if (pkg.status != PackageStatus.CONFIRMED) {
            _archivePackage(tokenId, pkg.sender, pkg.consumer);
        }
        emit PackageBanned(tokenId, msg.sender, reason);
    }

    /**
     * @notice Unbans a previously banned package
     * @param tokenId The identifier of the package NFT to unban
     * @dev Unarchives the package if it wasn't confirmed, allows normal use
     * @custom:access onlyTracker
     * @custom:requirements Token must exist
     * @custom:emits PackageUnbanned
     */
    function unbanPackage(uint256 tokenId) external onlyTracker {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            revert BoutNFT__TokenNotExist();
        }

        Package storage pkg = packages[tokenId];
        if (!pkg.isBanned) {
            return;
        }

        pkg.isBanned = false;

        if (pkg.status != PackageStatus.CONFIRMED) {
            _unarchivePackage(tokenId, pkg.sender, pkg.consumer);
        }

        emit PackageUnbanned(tokenId, msg.sender);
    }

    /**
     * @notice Checks if a package is currently banned
     * @param tokenId The identifier of the package NFT
     * @return true if the package is banned, false otherwise
     * @dev Returns false for non-existent tokens
     */
    function isPackageBanned(uint256 tokenId) external view returns (bool) {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            return false;
        }

        return packages[tokenId].isBanned;
    }

    /**
     * @notice Returns active supplier packages excluding banned ones
     * @param supplier The supplier address to query
     * @return Array of active, non-banned package token IDs
     * @dev Filtered version of getActiveSupplierPackages(), useful for UI
     */
    function getActiveSupplierPackagesNotBanned(address supplier) external view returns (uint256[] memory) {
        uint256[] memory allActive = s_activeSupplierPackages[supplier];
        uint256 validCount = 0;

        for (uint256 i = 0; i < allActive.length; i++) {
            if (!packages[allActive[i]].isBanned) {
                validCount++;
            }
        }

        uint256[] memory validPackages = new uint256[](validCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allActive.length; i++) {
            if (!packages[allActive[i]].isBanned) {
                validPackages[index] = allActive[i];
                index++;
            }
        }

        return validPackages;
    }

    /**
     * @notice Returns active consumer packages excluding banned ones
     * @param consumer The consumer address to query
     * @return Array of active, non-banned package token IDs
     * @dev Filtered version of getActiveConsumerPackages(), useful for UI
     */
    function getActiveConsumerPackagesNotBanned(address consumer) external view returns (uint256[] memory) {
        uint256[] memory allActive = s_activeConsumerPackages[consumer];
        uint256 validCount = 0;

        for (uint256 i = 0; i < allActive.length; i++) {
            if (!packages[allActive[i]].isBanned) {
                validCount++;
            }
        }

        uint256[] memory validPackages = new uint256[](validCount);
        uint256 index = 0;

        for (uint256 i = 0; i < allActive.length; i++) {
            if (!packages[allActive[i]].isBanned) {
                validPackages[index] = allActive[i];
                index++;
            }
        }

        return validPackages;
    }

    /**
     * @notice Returns complete package information for a given token
     * @param tokenId The identifier of the package NFT
     * @return Package Complete package struct with all metadata
     * @dev Contains bottle count, addresses, timestamps, status, and ban status
     * @custom:requirements Token must exist
     */
    function getPackage(uint256 tokenId) external view returns (Package memory) {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            revert BoutNFT__TokenNotExist();
        }
        return packages[tokenId];
    }

    /**
     * @notice Checks if a package token exists
     * @param tokenId The identifier to check
     * @return true if the token has been minted and exists
     * @dev More gas-efficient than try/catch on getPackage()
     */
    function packageExists(uint256 tokenId) external view returns (bool) {
        return tokenId < nextTokenId && tokenId > 0;
    }

    /**
     * @notice Returns the current status of a package
     * @param tokenId The identifier of the package NFT
     * @return PackageStatus Current status (SENT, RECEIVED, RETURNED, CONFIRMED)
     * @dev Quick status check without loading full package data
     * @custom:requirements Token must exist
     */
    function getPackageStatus(uint256 tokenId) external view returns (PackageStatus) {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            revert BoutNFT__TokenNotExist();
        }
        return packages[tokenId].status;
    }

    /**
     * @notice Returns all active (non-archived) packages for a supplier
     * @param supplier The supplier address to query
     * @return Array of active package token IDs
     * @dev Includes banned packages, use getActiveSupplierPackagesNotBanned() to exclude them
     */
    function getActiveSupplierPackages(address supplier) external view returns (uint256[] memory) {
        return s_activeSupplierPackages[supplier];
    }

    /**
     * @notice Returns all active (non-archived) packages for a consumer
     * @param consumer The consumer address to query
     * @return Array of active package token IDs
     * @dev Includes banned packages, use getActiveConsumerPackagesNotBanned() to exclude them
     */
    function getActiveConsumerPackages(address consumer) external view returns (uint256[] memory) {
        return s_activeConsumerPackages[consumer];
    }

    /**
     * @notice Returns paginated archived packages for a supplier
     * @param supplier The supplier address to query
     * @param offset Starting index for pagination (0-based)
     * @param limit Maximum number of packages to return (max 100)
     * @return packageArray Array of archived package token IDs
     * @return hasMore true if there are more packages beyond this page
     * @dev Pagination prevents gas limit issues with large archived lists
     * @custom:requirements Limit must be ≤ 100
     */
    function getArchivedSupplierPackages(address supplier, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory packageArray, bool hasMore)
    {
        if (limit > 100) {
            revert BoutNFT__LimitTooHigh();
        }
        uint256[] storage allArchived = s_archivedSupplierPackages[supplier];
        uint256 totalLength = allArchived.length;

        if (offset >= totalLength) {
            return (new uint256[](0), false);
        }

        uint256 endIndex = offset + limit;
        if (endIndex > totalLength) {
            endIndex = totalLength;
        }

        uint256 resultLength = endIndex - offset;
        uint256[] memory result = new uint256[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = allArchived[offset + i];
        }
        bool hasMorePackages = endIndex < totalLength;
        return (result, hasMorePackages);
    }

    /**
     * @notice Returns paginated archived packages for a consumer
     * @param consumer The consumer address to query
     * @param offset Starting index for pagination (0-based)
     * @param limit Maximum number of packages to return (max 100)
     * @return packageArray Array of archived package token IDs
     * @return hasMore true if there are more packages beyond this page
     * @dev Pagination prevents gas limit issues with large archived lists
     * @custom:requirements Limit must be ≤ 100
     */
    function getArchivedConsumerPackages(address consumer, uint256 offset, uint256 limit)
        external
        view
        returns (uint256[] memory packageArray, bool hasMore)
    {
        if (limit > 100) {
            revert BoutNFT__LimitTooHigh();
        }
        uint256[] storage allArchived = s_archivedConsumerPackages[consumer];
        uint256 totalLength = allArchived.length;

        if (offset >= totalLength) {
            return (new uint256[](0), false);
        }

        uint256 endIndex = offset + limit;
        if (endIndex > totalLength) {
            endIndex = totalLength;
        }

        uint256 resultLength = endIndex - offset;
        uint256[] memory result = new uint256[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = allArchived[offset + i];
        }
        bool hasMorePackage = endIndex < totalLength;
        return (result, hasMorePackage);
    }

    /**
     * @notice Returns package count statistics for a supplier
     * @param supplier The supplier address to analyze
     * @return activeCount Number of active (non-archived) packages
     * @return archivedCount Number of archived (completed) packages
     * @return totalCount Total packages ever created by this supplier
     * @dev Efficient way to get counts without loading full arrays
     */
    function getSupplierPackageCounts(address supplier)
        external
        view
        returns (uint256 activeCount, uint256 archivedCount, uint256 totalCount)
    {
        activeCount = s_supplierActiveCount[supplier];
        archivedCount = s_supplierArchivedCount[supplier];
        totalCount = activeCount + archivedCount;
    }

    /**
     * @notice Returns package count statistics for a consumer
     * @param consumer The consumer address to analyze
     * @return activeCount Number of active (non-archived) packages
     * @return archivedCount Number of archived (completed) packages
     * @return totalCount Total packages ever assigned to this consumer
     * @dev Efficient way to get counts without loading full arrays
     */
    function getConsumerPackageCounts(address consumer)
        external
        view
        returns (uint256 activeCount, uint256 archivedCount, uint256 totalCount)
    {
        activeCount = s_consumerActiveCount[consumer];
        archivedCount = s_consumerArchivedCount[consumer];
        totalCount = activeCount + archivedCount;
    }

    function getSupplierPackages(address supplier) external view returns (uint256[] memory) {
        return s_supplierPackageIds[supplier];
    }

    function getConsumerPackages(address consumer) external view returns (uint256[] memory) {
        return s_consumerPackageIds[consumer];
    }

    function getTotalPackagesBySupplier(address supplier) external view returns (uint256) {
        return s_supplierPackageIds[supplier].length;
    }

    function getTotalPackagesByConsumer(address consumer) external view returns (uint256) {
        return s_consumerPackageIds[consumer].length;
    }

    /**
     * @notice Returns the address of the authorized BoutTracker contract
     * @return The current tracker contract address
     * @dev Only this address can call onlyTracker functions
     */
    function getTracker() public view returns (address) {
        return tracker;
    }

    /**
     * @notice Returns the next token ID that will be minted
     * @return The next available token ID
     * @dev Useful for predicting token IDs before minting
     */
    function getNextTokenId() public view returns (uint256) {
        return nextTokenId;
    }
}
