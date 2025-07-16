// ==========================================
// ABI COMPLET - BoutTracker
// ==========================================

export const boutTrackerAbi = [
  // Constructor
  {
    inputs: [
      { internalType: "address", name: "_boutNFT", type: "address" },
      { internalType: "address", name: "_boutToken", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "addressSupplier",
        type: "address",
      },
    ],
    name: "SupplierRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "addressConsumer",
        type: "address",
      },
    ],
    name: "ConsumerRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: false,
        internalType: "enum BoutTracker.UserRole",
        name: "oldRole",
        type: "uint8",
      },
    ],
    name: "UserRoleRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "supplier",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bottleCount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "packageLink",
        type: "string",
      },
    ],
    name: "PackageCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "consumer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "supplier",
        type: "address",
      },
    ],
    name: "PackageReceived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "consumer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "supplier",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "pendingConsumerReward",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "pendingSupplierBonus",
        type: "uint256",
      },
    ],
    name: "BottlesReturnedPending",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "supplier",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "consumer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "returnedCount",
        type: "uint256",
      },
    ],
    name: "ReturnConfirmed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "consumer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "consumerReward",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "supplier",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "supplierBonus",
        type: "uint256",
      },
    ],
    name: "RewardsAllocated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "RewardsWithdrawn",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "oldReward",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newReward",
        type: "uint256",
      },
    ],
    name: "RewardPerBottleUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "oldRate",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newRate",
        type: "uint256",
      },
    ],
    name: "SupplierBonusRateUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "supplier",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "packagesBanned",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "MaliciousSupplierBanned",
    type: "event",
  },

  // Write Functions
  {
    inputs: [],
    name: "registerAsSupplier",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "registerAsConsumer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "revokeUserRole",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "bottleCount", type: "uint256" },
      { internalType: "string", name: "packageLink", type: "string" },
      { internalType: "address", name: "intendedConsumer", type: "address" },
    ],
    name: "createPackage",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "packageLink", type: "string" }],
    name: "receivePackage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "returnedCount", type: "uint256" },
    ],
    name: "returnBottles",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "confirmReturn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawRewards",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "_rewardPerBottle", type: "uint256" },
    ],
    name: "setRewardPerBottle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_bonusRate", type: "uint256" }],
    name: "setSupplierBonusRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "maliciousSupplier", type: "address" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "banSupplierPackages",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // View Functions
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserRole",
    outputs: [
      { internalType: "enum BoutTracker.UserRole", name: "", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "isSupplier",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "isConsumer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "isRegistered",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getWithdrawableRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMyWithdrawableRewards",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "hasWithdrawableRewards",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getPendingRewards",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "consumerReward", type: "uint256" },
          { internalType: "uint256", name: "supplierBonus", type: "uint256" },
          { internalType: "bool", name: "claimed", type: "bool" },
        ],
        internalType: "struct BoutTracker.PendingRewards",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "hasUnclaimedRewards",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getGlobalStats",
    outputs: [
      { internalType: "uint256", name: "totalPackages", type: "uint256" },
      {
        internalType: "uint256",
        name: "totalBottlesCirculation",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalBottlesReturned",
        type: "uint256",
      },
      { internalType: "uint256", name: "totalRewards", type: "uint256" },
      { internalType: "uint256", name: "globalReturnRate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "supplier", type: "address" }],
    name: "getSupplierStats",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "totalPackageSent",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalBottlesSent",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalBottlesReturned",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalRewardsEarned",
            type: "uint256",
          },
        ],
        internalType: "struct BoutTracker.SupplierStats",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "consumer", type: "address" }],
    name: "getConsumerStats",
    outputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "totalPackagesReceived",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalBottlesReceived",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalBottlesReturned",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "totalRewardsEarned",
            type: "uint256",
          },
        ],
        internalType: "struct BoutTracker.ConsumerStats",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBoutNFT",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getBoutToken",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getRewardPerBottleReturned",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getSupplierBonusRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string", name: "packageLink", type: "string" }],
    name: "getTokenIdByLink",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalPackagesCreated",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalBottlesInCirculation",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalBottlesReturned",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalRewardsDistributed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ==========================================
// Configuration des adresses par réseau
// ==========================================

interface BoutContractsConfig {
  [chainId: number]: {
    tracker: string;
    token: string;
    nft: string;
  };
}

export const chainsToBout: BoutContractsConfig = {
  // Sepolia testnet
  11155111: {
    tracker: "0x...", // À remplir après déploiement
    token: "0x...",
    nft: "0x...",
  },
  // Anvil local - ADRESSES RÉELLES
  31337: {
    tracker: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // BoutTracker
    token: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // BoutToken
    nft: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // BoutNFT
  },
};

// ==========================================
// Utilitaires et Enums
// ==========================================

export enum UserRole {
  NONE = 0,
  SUPPLIER = 1,
  CONSUMER = 2,
  ADMIN = 3,
}

export enum PackageStatus {
  SENT = 0,
  RECEIVED = 1,
  RETURNED = 2,
  CONFIRMED = 3,
}

// ==========================================
// Types TypeScript pour les retours de contrats
// ==========================================

export interface PackageStruct {
  bottleCount: bigint;
  sender: string;
  consumer: string;
  createdAt: bigint;
  receivedAt: bigint;
  returnedAt: bigint;
  returnedCount: bigint;
  status: PackageStatus;
  packageLink: string;
  isBanned: boolean;
}

export interface PendingRewards {
  consumerReward: bigint;
  supplierBonus: bigint;
  claimed: boolean;
}

export interface SupplierStats {
  totalPackageSent: bigint;
  totalBottlesSent: bigint;
  totalBottlesReturned: bigint;
  totalRewardsEarned: bigint;
}

export interface ConsumerStats {
  totalPackagesReceived: bigint;
  totalBottlesReceived: bigint;
  totalBottlesReturned: bigint;
  totalRewardsEarned: bigint;
}

export interface GlobalStats {
  totalPackages: bigint;
  totalBottlesCirculation: bigint;
  totalBottlesReturned: bigint;
  totalRewards: bigint;
  globalReturnRate: bigint;
}

// ==========================================
// Helpers pour conversion Wei <-> Ether
// ==========================================

export const BOUT_DECIMALS = 18;

export function weiToBout(wei: bigint): number {
  return Number(wei) / Math.pow(10, BOUT_DECIMALS);
}

export function boutToWei(bout: number): bigint {
  return BigInt(Math.floor(bout * Math.pow(10, BOUT_DECIMALS)));
}

// ==========================================
// Constantes du système BOUT
// ==========================================

export const BOUT_CONSTANTS = {
  MAX_ACTIVE_PACKAGES_PER_ADDRESS: 50,
  MAX_ACTIVE_PACKAGES_ADMIN_OVERRIDE: 200,
  DEFAULT_REWARD_PER_BOTTLE: boutToWei(1), // 1 BOUT par bouteille par défaut
  DEFAULT_SUPPLIER_BONUS_RATE: 10, // 10% de bonus pour les suppliers
} as const;

// ==========================================
// Messages d'erreur pour debugging
// ==========================================

export const ERROR_MESSAGES = {
  // BoutTracker errors
  ALREADY_REGISTERED: "User is already registered",
  NOT_SUPPLIER: "Only suppliers can perform this action",
  NOT_CONSUMER: "Only consumers can perform this action",
  NOT_REGISTERED: "User is not registered",
  PACKAGE_NOT_FOUND: "Package does not exist",
  PACKAGE_NOT_AVAILABLE: "Package is not available for this action",
  NOT_INTENDED_CONSUMER: "You are not the intended consumer for this package",
  INVALID_RETURN_COUNT: "Cannot return more bottles than received",
  NO_REWARDS_AVAILABLE: "No rewards available for withdrawal",

  // BoutNFT errors
  ADDRESS_NOT_CORRECT: "Invalid address provided",
  INVALID_NUMBER_OF_BOTTLE: "Invalid bottle count",
  LINK_EMPTY: "Package link cannot be empty",
  TOKEN_NOT_EXIST: "Token does not exist",
  CANT_RETURNED_MORE_THAN_SENT: "Cannot return more than sent",
  TOO_MANY_ACTIVE_PACKAGES: "Too many active packages for this address",
  PACKAGE_IS_BANNED: "Package is banned",

  // BoutToken errors
  AMOUNT_NOT_ENOUGH: "Amount must be greater than 0",
  ONLY_TRACKER_CAN_ACCESS: "Only tracker contract can access this function",
} as const;

// ==========================================
// ABI COMPLET - BoutToken
// ==========================================

export const boutTokenAbi = [
  // Constructor
  {
    inputs: [{ internalType: "address", name: "_tracker", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldTracker",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newTracker",
        type: "address",
      },
    ],
    name: "TrackerUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "TokensMinted",
    type: "event",
  },
  // ERC20 Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },

  // Write Functions
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_tracker", type: "address" }],
    name: "setTracker",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // ERC20 Write Functions
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "burnFrom",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // View Functions
  {
    inputs: [],
    name: "tracker",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // ERC20 View Functions
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ==========================================
// ABI COMPLET - BoutNFT
// ==========================================

export const boutNftAbi = [
  // Constructor
  {
    inputs: [{ internalType: "address", name: "_tracker", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldTracker",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newTracker",
        type: "address",
      },
    ],
    name: "TrackerUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "supplier",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bottleCount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "string",
        name: "packageLink",
        type: "string",
      },
    ],
    name: "PackageCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "enum BoutNFT.PackageStatus",
        name: "oldStatus",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "enum BoutNFT.PackageStatus",
        name: "status",
        type: "uint8",
      },
    ],
    name: "StatusUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "consumer",
        type: "address",
      },
    ],
    name: "ConsumerAssigned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "count",
        type: "uint256",
      },
    ],
    name: "ReturnedCountUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "supplier",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "consumer",
        type: "address",
      },
    ],
    name: "PackageArchived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "addressOverridden",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "newLimit",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "AdminLimitOverrideUsed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "supplier",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "consumer",
        type: "address",
      },
    ],
    name: "EmergencyPackageArchived",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "string",
        name: "reason",
        type: "string",
      },
    ],
    name: "PackageBanned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "admin",
        type: "address",
      },
    ],
    name: "PackageUnbanned",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "supplier",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "consumer",
        type: "address",
      },
    ],
    name: "PackageUnarchived",
    type: "event",
  },
  // ERC721 Events
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "approved",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "operator",
        type: "address",
      },
      { indexed: false, internalType: "bool", name: "approved", type: "bool" },
    ],
    name: "ApprovalForAll",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      {
        indexed: true,
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },

  // Write Functions
  {
    inputs: [{ internalType: "address", name: "_tracker", type: "address" }],
    name: "setTracker",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "supplier", type: "address" },
      { internalType: "uint256", name: "bottleCount", type: "uint256" },
      { internalType: "string", name: "packageLink", type: "string" },
      { internalType: "address", name: "_consumer", type: "address" },
    ],
    name: "createPackage",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      {
        internalType: "enum BoutNFT.PackageStatus",
        name: "status",
        type: "uint8",
      },
    ],
    name: "updateStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "customLimit", type: "uint256" },
    ],
    name: "setAddressActiveLimit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "address", name: "consumer", type: "address" },
    ],
    name: "setConsumer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "uint256", name: "count", type: "uint256" },
    ],
    name: "setReturnedCount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "string", name: "reason", type: "string" },
    ],
    name: "banPackage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "unbanPackage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // View Functions
  {
    inputs: [],
    name: "MAX_ACTIVE_PACKAGES_PER_ADDRESS",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MAX_ACTIVE_PACKAGES_ADMIN_OVERRIDE",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getAddressActiveLimit",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "isPackageBanned",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "supplier", type: "address" }],
    name: "getActiveSupplierPackagesNotBanned",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "consumer", type: "address" }],
    name: "getActiveConsumerPackagesNotBanned",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getPackage",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "bottleCount", type: "uint256" },
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "address", name: "consumer", type: "address" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "uint256", name: "receivedAt", type: "uint256" },
          { internalType: "uint256", name: "returnedAt", type: "uint256" },
          { internalType: "uint256", name: "returnedCount", type: "uint256" },
          {
            internalType: "enum BoutNFT.PackageStatus",
            name: "status",
            type: "uint8",
          },
          { internalType: "string", name: "packageLink", type: "string" },
          { internalType: "bool", name: "isBanned", type: "bool" },
        ],
        internalType: "struct BoutNFT.Package",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "packageExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getPackageStatus",
    outputs: [
      { internalType: "enum BoutNFT.PackageStatus", name: "", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "supplier", type: "address" }],
    name: "getActiveSupplierPackages",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "consumer", type: "address" }],
    name: "getActiveConsumerPackages",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "supplier", type: "address" }],
    name: "getSupplierPackages",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "consumer", type: "address" }],
    name: "getConsumerPackages",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTracker",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getNextTokenId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // ERC721 View Functions
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
