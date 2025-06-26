// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BoutToken} from "src/BoutToken.sol";

contract BoutNFT is ERC721, Ownable{

    error BoutNFT__AddressNotCorrect();
    error BottleTrackingNFT__NotConsumer();
    error BottleTrackingNFT__InvalidState();
    error BoutNFT__InvalidNumberOfBottle();
    error BoutToken__OnlyTrackerCanAccess();
    error BoutNFT__LinkEmpty();
    error BoutNFT__TokenNotExist();
    error BoutNFT__CantReturnedMoreThanSent();

    event TrackerUpdated(address indexed oldTracker, address indexed newTracker);
    event PackageCreated(uint256 indexed tokenId, address indexed supplier, uint256 bottleCount, string packageLink);
    event StatusUpdated(uint256 indexed tokenId, PackageStatus oldStatus, PackageStatus status);
    event ConsumerAssigned(uint256 indexed tokenId, address indexed consumer);
    event ReturnedCountUpdated(uint256 indexed tokenId, uint256 count);

    modifier onlyTracker(){
        if(msg.sender != tracker)
        {
            revert BoutToken__OnlyTrackerCanAccess();
        }
        else{
            _;
        }
        
    }

    enum PackageStatus{
        SENT,
        RECEIVED,
        RETURNED,
        CONFIRMED
    }
    
    struct Package{
        uint256 bottleCount;
        address sender;
        address consumer;
        uint256 createdAt;
        uint256 receivedAt;
        uint256 returnedAt;
        uint256 returnedCount;
        PackageStatus status;
        string packageLink;
    }

    mapping(uint256 => Package) public packages;

    BoutToken public boutToken;
    address public tracker;
    uint256 public nextTokenId = 1;

    constructor() ERC721("Bout Package","BPKG") Ownable(msg.sender){
    }

    function setTracker(address _tracker) external onlyOwner{
        if(_tracker == address(0))
        {
            revert BoutNFT__AddressNotCorrect();
        }
        address oldTracker = tracker;
        tracker = _tracker;

        emit TrackerUpdated(oldTracker, tracker);
    }

    function createPackage(
        address supplier,
        uint256 bottleCount, 
        string memory packageLink) 
        external onlyTracker returns(uint256){
            if(supplier == address(0)){
                revert BoutNFT__AddressNotCorrect();
            }
            if(bottleCount <= 0){
                revert BoutNFT__InvalidNumberOfBottle();
            }
            if(bytes(packageLink).length <= 0){
                revert BoutNFT__LinkEmpty();
            }

            uint256 tokenId = nextTokenId;
            nextTokenId++;

            packages[tokenId] = Package({
                bottleCount: bottleCount,
                sender: supplier,
                consumer: address(0),
                createdAt:block.timestamp,
                receivedAt: 0,
                returnedAt:0,
                returnedCount: 0,
                status: PackageStatus.SENT,
                packageLink: packageLink
            });

            _mint(supplier, tokenId);

            emit PackageCreated(tokenId, supplier, bottleCount, packageLink);

            return tokenId;
        } 

        function updateStatus(uint256 tokenId, PackageStatus status) external onlyTracker{
            if(tokenId >= nextTokenId || tokenId <= 0){
                revert BoutNFT__TokenNotExist();
            }

            Package memory pkg = packages[tokenId];
            PackageStatus oldStatus = pkg.status;

            pkg.status = status;

            if(status == PackageStatus.RECEIVED){
                pkg.receivedAt = block.timestamp;
            } else if(status == PackageStatus.RETURNED){
                pkg.returnedAt = block.timestamp;
            }
            packages[tokenId] = pkg;

            emit StatusUpdated(tokenId, oldStatus, status);
        }

        function setConsumer(uint256 tokenId, address consumer) external onlyTracker{
            if(tokenId >= nextTokenId || tokenId <= 0){
                revert BoutNFT__TokenNotExist();
            }
            if(consumer == address(0)){
                revert BoutNFT__AddressNotCorrect();
            }

            packages[tokenId].consumer = consumer;
            emit ConsumerAssigned(tokenId, consumer);
        }

        function setReturnedCount(uint256 tokenId, uint256 count) external onlyTracker{
            if(tokenId >= nextTokenId || tokenId <= 0){
                revert BoutNFT__TokenNotExist();
            }
            if(count > packages[tokenId].bottleCount){
                revert BoutNFT__CantReturnedMoreThanSent();
            }

            packages[tokenId].returnedCount = count;
            emit ReturnedCountUpdated(tokenId, count);
        }

        function getPackage(uint256 tokenId) external view returns (Package memory) {
            if(tokenId >= nextTokenId || tokenId <= 0){
                revert BoutNFT__TokenNotExist();
            }
            return packages[tokenId];
        }

        function packageExists(uint256 tokenId) external view returns (bool) {
            return tokenId < nextTokenId && tokenId > 0;
        }

        function getPackageStatus(uint256 tokenId) external view returns (PackageStatus) {
            if(tokenId >= nextTokenId || tokenId <= 0){ 
                revert BoutNFT__TokenNotExist();
            }
            return packages[tokenId].status;
        }

        /**
         * @dev Récupère tous les tokenIds des packages où l'adresse est le supplier
         * @param supplier L'adresse du fournisseur
         * @return Array des tokenIds possédés par ce supplier
         */
        function getSupplierPackages(address supplier) external view returns (uint256[] memory) {
            uint256 count = 0;
            
            // Première boucle : compter
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (packages[i].sender == supplier) {
                    count++;
                }
            }
            
            // Créer le tableau de la bonne taille
            uint256[] memory result = new uint256[](count);
            uint256 index = 0;
            
            // Deuxième boucle : remplir
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (packages[i].sender == supplier) {
                    result[index] = i;
                    index++;
                }
            }
            
            return result;
        }

        /**
         * @dev Récupère tous les tokenIds des packages où l'adresse est le consumer
         * @param consumer L'adresse du consommateur
         * @return Array des tokenIds où cette adresse est consumer
         */
        function getConsumerPackages(address consumer) external view returns (uint256[] memory) {
            uint256 count = 0;
            
            // Première boucle : compter
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (packages[i].consumer == consumer) {
                    count++;
                }
            }
            
            // Créer le tableau de la bonne taille
            uint256[] memory result = new uint256[](count);
            uint256 index = 0;
            
            // Deuxième boucle : remplir
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (packages[i].consumer == consumer) {
                    result[index] = i;
                    index++;
                }
            }
            
            return result;
        }

        /**
         * @dev Compte le nombre total de packages créés par un supplier
         * @param supplier L'adresse du fournisseur
         * @return Le nombre total de packages
         */
        function getTotalPackagesBySupplier(address supplier) external view returns (uint256) {
            uint256 count = 0;
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (packages[i].sender == supplier) {
                    count++;
                }
            }
            return count;
        }

        /**
         * @dev Compte le nombre total de packages reçus par un consumer
         * @param consumer L'adresse du consommateur
         * @return Le nombre total de packages reçus
         */
        function getTotalPackagesByConsumer(address consumer) external view returns (uint256) {
            uint256 count = 0;
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (packages[i].consumer == consumer) {
                    count++;
                }
            }
            return count;
        }

        /**
         * @dev Récupère les packages d'un supplier avec un statut spécifique
         * @param supplier L'adresse du fournisseur
         * @param status Le statut recherché
         * @return Array des tokenIds avec ce statut
         */
        function getSupplierPackagesByStatus(address supplier, PackageStatus status) external view returns (uint256[] memory) {
            uint256 count = 0;
            
            // Compter
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (packages[i].sender == supplier && packages[i].status == status) {
                    count++;
                }
            }
            
            // Remplir
            uint256[] memory result = new uint256[](count);
            uint256 index = 0;
            
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (packages[i].sender == supplier && packages[i].status == status) {
                    result[index] = i;
                    index++;
                }
            }
            
            return result;
        }

        /**
         * @dev Récupère les packages d'un consumer avec un statut spécifique
         * @param consumer L'adresse du consommateur
         * @param status Le statut recherché
         * @return Array des tokenIds avec ce statut
         */
        function getConsumerPackagesByStatus(address consumer, PackageStatus status) external view returns (uint256[] memory) {
            uint256 count = 0;
            
            // Compter
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (packages[i].consumer == consumer && packages[i].status == status) {
                    count++;
                }
            }
            
            // Remplir
            uint256[] memory result = new uint256[](count);
            uint256 index = 0;
            
            for (uint256 i = 1; i < nextTokenId; i++) {
                if (packages[i].consumer == consumer && packages[i].status == status) {
                    result[index] = i;
                    index++;
                }
            }
            
            return result;
        }
}