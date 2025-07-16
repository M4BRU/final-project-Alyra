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

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        if (operator == tracker) return true;
        return super.isApprovedForAll(owner, operator);
    }

    function setTracker(address _tracker) external onlyOwner {
        if (_tracker == address(0)) {
            revert BoutNFT__AddressNotCorrect();
        }
        address oldTracker = tracker;
        tracker = _tracker;

        emit TrackerUpdated(oldTracker, tracker);
    }

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

    function setAddressActiveLimit(address user, uint256 customLimit) external onlyOwner {
        if (customLimit > MAX_ACTIVE_PACKAGES_ADMIN_OVERRIDE) {
            revert BoutNFT__AdminOverrideLimitExceeded();
        }
        s_adminLimitOverrides[user] = customLimit;
        emit AdminLimitOverrideUsed(user, customLimit, msg.sender);
    }

    function getAddressActiveLimit(address user) public view returns (uint256) {
        uint256 customLimit = s_adminLimitOverrides[user];
        return customLimit > 0 ? customLimit : MAX_ACTIVE_PACKAGES_PER_ADDRESS;
    }

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

    function isPackageBanned(uint256 tokenId) external view returns (bool) {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            return false;
        }

        return packages[tokenId].isBanned;
    }

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

    function getPackage(uint256 tokenId) external view returns (Package memory) {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            revert BoutNFT__TokenNotExist();
        }
        return packages[tokenId];
    }

    function packageExists(uint256 tokenId) external view returns (bool) {
        return tokenId < nextTokenId && tokenId > 0;
    }

    function getPackageStatus(uint256 tokenId) external view returns (PackageStatus) {
        if (tokenId >= nextTokenId || tokenId <= 0) {
            revert BoutNFT__TokenNotExist();
        }
        return packages[tokenId].status;
    }

    function getActiveSupplierPackages(address supplier) external view returns (uint256[] memory) {
        return s_activeSupplierPackages[supplier];
    }

    function getActiveConsumerPackages(address consumer) external view returns (uint256[] memory) {
        return s_activeConsumerPackages[consumer];
    }

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

    function getSupplierPackageCounts(address supplier)
        external
        view
        returns (uint256 activeCount, uint256 archivedCount, uint256 totalCount)
    {
        activeCount = s_supplierActiveCount[supplier];
        archivedCount = s_supplierArchivedCount[supplier];
        totalCount = activeCount + archivedCount;
    }

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

    function getTracker() public view returns (address) {
        return tracker;
    }

    function getNextTokenId() public view returns (uint256) {
        return nextTokenId;
    }
}
