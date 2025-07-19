"use client";

import { useState, useCallback, useEffect } from "react";
import {
  chainsToBout,
  boutTrackerAbi,
  boutTokenAbi,
  boutNftAbi,
} from "@/constants";
import RegisterUser from "./RegisterUserForm";
import CreatePackage from "./CreatePackage";
import ReceivePackage from "./ReceivePackage";
import ReturnBottles from "./ReturnBottles";
import ConfirmReturn from "./ConfirmReturn";
import WithdrawTokens from "./WithdrawTokens";
import BoutEvent from "./BoutEvent";
import BoutPackageList from "./BoutPackageList";
import {
  useChainId,
  useConfig,
  useAccount,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { readContract } from "@wagmi/core";
import { Address, parseAbiItem } from "viem";
import { usePublicClient } from "../hooks/usePublicClient";

export type BoutEvent = {
  type:
    | "SupplierRegistered"
    | "ConsumerRegistered"
    | "PackageCreated"
    | "PackageReceived"
    | "BottlesReturnedPending"
    | "RewardsAllocated"
    | "RewardsWithdrawn";
  userAddress?: string;
  userRole?: number;
  packageId?: number;
  supplier?: string;
  consumer?: string;
  amount?: number;
  bottleCount?: number;
  blockNumber: number;
  transactionHash?: string;
};

export type PackageType = {
  id: number;
  supplier: string;
  consumer?: string;
  status: number;
  rewardAmount: number;
  bottleCount: number;
  returnedCount?: number;
  packageLink: string;
  createdAt?: number;
  receivedAt?: number;
  returnedAt?: number;
};

export default function BoutSystem() {
  const chainId = useChainId();
  const config = useConfig();
  const publicClient = usePublicClient();
  const boutTrackerAddress = chainsToBout[chainId]?.tracker;
  const boutTokenAddress = chainsToBout[chainId]?.token;
  const { writeContractAsync } = useWriteContract();
  const { address } = useAccount();

  const [events, setEvents] = useState<BoutEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [eventRange, setEventRange] = useState<number>(300);

  const [userRole, setUserRole] = useState<"SUPPLIER" | "CONSUMER" | null>(
    null
  );
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const { data: rawTokenBalance } = useReadContract({
    address: boutTokenAddress as `0x${string}`,
    abi: boutTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!boutTokenAddress && !!address && isRegistered,
    },
  });

  const tokenBalance = rawTokenBalance ? Number(rawTokenBalance) / 1e18 : 0;

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const checkUserRegistration = useCallback(async () => {
    if (!boutTrackerAddress || !address) return;

    try {
      const isRegistered = await readContract(config, {
        address: boutTrackerAddress as Address,
        abi: boutTrackerAbi,
        functionName: "isRegistered",
        args: [address],
      });

      if (isRegistered) {
        const userRole = await readContract(config, {
          address: boutTrackerAddress as Address,
          abi: boutTrackerAbi,
          functionName: "getUserRole",
          args: [address],
        });

        setIsRegistered(true);
        const newRole = userRole === 1 ? "SUPPLIER" : "CONSUMER";
        setUserRole(newRole);
      } else {
        setIsRegistered(false);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du rôle:", error);
      setIsRegistered(false);
      setUserRole(null);
    }
  }, [boutTrackerAddress, address, config]);

  const getPackagesFromEvents = useCallback(async () => {
    if (!boutTrackerAddress || !isRegistered || !address) return;

    setLoadingPackages(true);
    try {
      const rewardPerBottleRaw = (await readContract(config, {
        address: boutTrackerAddress as Address,
        abi: boutTrackerAbi,
        functionName: "getRewardPerBottleReturned",
      })) as bigint;

      const rewardPerBottle = Number(rewardPerBottleRaw) / 1e18;

      let packageIds: readonly bigint[] = [];

      if (userRole === "CONSUMER") {
        packageIds = (await readContract(config, {
          address: chainsToBout[chainId]?.nft as Address,
          abi: boutNftAbi,
          functionName: "getActiveConsumerPackages",
          args: [address],
        })) as readonly bigint[];
      } else if (userRole === "SUPPLIER") {
        packageIds = (await readContract(config, {
          address: chainsToBout[chainId]?.nft as Address,
          abi: boutNftAbi,
          functionName: "getActiveSupplierPackages",
          args: [address],
        })) as readonly bigint[];
      }

      const packageDetails: (PackageType | null)[] = await Promise.all(
        packageIds.map(async (tokenId) => {
          try {
            const packageData = (await readContract(config, {
              address: chainsToBout[chainId]?.nft as Address,
              abi: boutNftAbi,
              functionName: "getPackage",
              args: [tokenId],
            })) as any;

            return {
              id: Number(tokenId),
              supplier: packageData.sender,
              consumer: packageData.consumer || undefined,
              status: Number(packageData.status),
              bottleCount: Number(packageData.bottleCount),
              returnedCount: Number(packageData.returnedCount) || 0,
              packageLink: packageData.packageLink,
              rewardAmount: rewardPerBottle,
              createdAt: Number(packageData.createdAt),
              receivedAt: Number(packageData.receivedAt),
              returnedAt: Number(packageData.returnedAt),
            } as PackageType;
          } catch (error) {
            console.warn(`Erreur pour package ${tokenId}:`, error);
            return null;
          }
        })
      );

      const validPackages = packageDetails.filter(
        (pkg): pkg is PackageType => pkg !== null
      );

      setPackages(validPackages);
    } catch (error) {
      console.error("Erreur lors de la récupération des packages:", error);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
  }, [boutTrackerAddress, isRegistered, userRole, address, config, chainId]);

  const getEvents = useCallback(async () => {
    if (!boutTrackerAddress) return;

    setLoadingEvents(true);

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock =
        currentBlock > BigInt(eventRange)
          ? currentBlock - BigInt(eventRange)
          : 0n;

      const [
        supplierRegisteredEvents,
        consumerRegisteredEvents,
        packageCreatedEvents,
        packageReceivedEvents,
        bottlesReturnedPendingEvents,
        rewardsAllocatedEvents,
        rewardsWithdrawnEvents,
      ] = await Promise.all([
        publicClient.getLogs({
          address: boutTrackerAddress as Address,
          event: parseAbiItem(
            "event SupplierRegistered(address indexed addressSupplier)"
          ),
          fromBlock: fromBlock,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: boutTrackerAddress as Address,
          event: parseAbiItem(
            "event ConsumerRegistered(address indexed addressConsumer)"
          ),
          fromBlock: fromBlock,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: boutTrackerAddress as Address,
          event: parseAbiItem(
            "event PackageCreated(uint256 indexed tokenId, address indexed supplier, uint256 bottleCount, string packageLink)"
          ),
          fromBlock: fromBlock,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: boutTrackerAddress as Address,
          event: parseAbiItem(
            "event PackageReceived(uint256 indexed tokenId, address indexed consumer, address indexed supplier)"
          ),
          fromBlock: fromBlock,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: boutTrackerAddress as Address,
          event: parseAbiItem(
            "event BottlesReturnedPending(uint256 indexed tokenId, address indexed consumer, address indexed supplier, uint256 pendingConsumerReward, uint256 pendingSupplierBonus)"
          ),
          fromBlock: fromBlock,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: boutTrackerAddress as Address,
          event: parseAbiItem(
            "event RewardsAllocated(uint256 indexed tokenId, address indexed consumer, uint256 consumerReward, address indexed supplier, uint256 supplierBonus)"
          ),
          fromBlock: fromBlock,
          toBlock: "latest",
        }),
        publicClient.getLogs({
          address: boutTrackerAddress as Address,
          event: parseAbiItem(
            "event RewardsWithdrawn(address indexed user, uint256 amount)"
          ),
          fromBlock: fromBlock,
          toBlock: "latest",
        }),
      ]);

      const combinedEvents: BoutEvent[] = [
        ...supplierRegisteredEvents.map((event) => ({
          type: "SupplierRegistered" as const,
          userAddress: event.args.addressSupplier?.toString(),
          userRole: 1,
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
        })),
        ...consumerRegisteredEvents.map((event) => ({
          type: "ConsumerRegistered" as const,
          userAddress: event.args.addressConsumer?.toString(),
          userRole: 2,
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
        })),
        ...packageCreatedEvents.map((event) => ({
          type: "PackageCreated" as const,
          packageId: Number(event.args.tokenId),
          supplier: event.args.supplier?.toString(),
          bottleCount: Number(event.args.bottleCount),
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
        })),
        ...packageReceivedEvents.map((event) => ({
          type: "PackageReceived" as const,
          packageId: Number(event.args.tokenId),
          consumer: event.args.consumer?.toString(),
          supplier: event.args.supplier?.toString(),
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
        })),
        ...bottlesReturnedPendingEvents.map((event) => ({
          type: "BottlesReturnedPending" as const,
          packageId: Number(event.args.tokenId),
          consumer: event.args.consumer?.toString(),
          supplier: event.args.supplier?.toString(),
          amount: Number(event.args.pendingConsumerReward) / 1e18,
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
        })),
        ...rewardsAllocatedEvents.map((event) => ({
          type: "RewardsAllocated" as const,
          packageId: Number(event.args.tokenId),
          consumer: event.args.consumer?.toString(),
          supplier: event.args.supplier?.toString(),
          amount: Number(event.args.consumerReward) / 1e18,
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
        })),
        ...rewardsWithdrawnEvents.map((event) => ({
          type: "RewardsWithdrawn" as const,
          userAddress: event.args.user?.toString(),
          amount: Number(event.args.amount) / 1e18,
          blockNumber: Number(event.blockNumber),
          transactionHash: event.transactionHash,
        })),
      ];

      const sortedEvents = combinedEvents.sort(
        (a, b) => b.blockNumber - a.blockNumber
      );

      setEvents(sortedEvents);
    } catch (error) {
      console.error("Erreur lors de la récupération des events:", error);
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, [boutTrackerAddress, publicClient, eventRange]);

  const refetchAll = useCallback(async () => {
    await Promise.all([
      getPackagesFromEvents(),
      getEvents(),
      checkUserRegistration(),
    ]);
    setRefreshCount((c) => c + 1);
  }, [getPackagesFromEvents, getEvents, checkUserRegistration]);

  useEffect(() => {
    if (address) {
      checkUserRegistration();
      getEvents();
    }
  }, [address, checkUserRegistration, getEvents]);

  useEffect(() => {
    if (isRegistered) {
      getPackagesFromEvents();
    }
  }, [isRegistered, getPackagesFromEvents]);

  if (!hasMounted) {
    return (
      <div className="space-y-4">
        <div className="text-center p-8">
          <div className="animate-pulse">Chargement de BOUT...</div>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <RegisterUser onRegistrationSuccess={refetchAll} refetch={refetchAll} />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              BOUT - Système de Réutilisation
            </h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Rôle:</span>
                <span
                  className={`font-semibold px-2 py-1 rounded-full text-sm ${
                    userRole === "SUPPLIER"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {userRole}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Balance:</span>
                <span className="font-bold text-lg text-green-600">
                  {tokenBalance.toFixed(2)} BOUT
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="/stats"
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 text-sm font-medium"
            >
              <span>📊</span>
              <span>Statistiques</span>
            </a>
            <div className="text-4xl">
              {userRole === "SUPPLIER" ? "🏭" : "👤"}
            </div>
          </div>
        </div>
      </div>

      {userRole === "SUPPLIER" && (
        <>
          <CreatePackage onPackageCreated={refetchAll} refetch={refetchAll} />
          <ConfirmReturn
            onReturnConfirmed={refetchAll}
            refetch={refetchAll}
            supplierPackages={packages}
          />
          <WithdrawTokens onTokensWithdrawn={refetchAll} refetch={refetchAll} />
        </>
      )}

      {userRole === "CONSUMER" && (
        <>
          <ReceivePackage onPackageReceived={refetchAll} refetch={refetchAll} />
          <ReturnBottles
            onBottlesReturned={refetchAll}
            refetch={refetchAll}
            userPackages={packages}
          />
          <WithdrawTokens onTokensWithdrawn={refetchAll} refetch={refetchAll} />
        </>
      )}

      <BoutPackageList
        packages={packages}
        loading={loadingPackages}
        userRole={userRole}
        onRefresh={getPackagesFromEvents}
      />

      <BoutEvent
        events={events}
        loading={loadingEvents}
        onRefresh={getEvents}
        eventRange={eventRange}
        onRangeChange={setEventRange}
      />
    </div>
  );
}
