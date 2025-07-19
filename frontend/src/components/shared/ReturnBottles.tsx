"use client";

import { useState, useEffect, useMemo } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useConfig,
} from "wagmi";
import { chainsToBout, boutTrackerAbi, boutNftAbi } from "@/constants";
import { useChainId, useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { Address } from "viem";

export interface ReturnBottlesProps {
  onBottlesReturned: () => void;
  refetch: () => void;
  userPackages?: Array<{
    id: number;
    bottleCount: number;
    status: number;
    rewardAmount: number;
    packageLink: string;
  }>;
}

export default function ReturnBottles({
  onBottlesReturned,
  refetch,
  userPackages = [],
}: ReturnBottlesProps) {
  const chainId = useChainId();
  const config = useConfig();
  const { address } = useAccount();
  const boutTrackerAddress = chainsToBout[chainId]?.tracker;

  const { data: rewardPerBottle } = useReadContract({
    address: boutTrackerAddress as `0x${string}`,
    abi: boutTrackerAbi,
    functionName: "getRewardPerBottleReturned",
  });

  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  const [returnedCount, setReturnedCount] = useState<string>("");
  const [isReturning, setIsReturning] = useState(false);
  const [error, setError] = useState<string>("");

  const {
    writeContract,
    data: hash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTransactionError,
    error: transactionError,
  } = useWaitForTransactionReceipt({
    hash,
  });

  const returnablePackages = userPackages.filter((pkg) => pkg.status === 1);

  const selectedPackage = returnablePackages.find(
    (pkg) => pkg.id === parseInt(selectedPackageId)
  );

  const estimatedReward = useMemo(() => {
    if (!selectedPackage || !returnedCount || !rewardPerBottle) return 0;

    const bottleCount = parseInt(returnedCount);
    const rewardInWei = BigInt(rewardPerBottle);
    const totalRewardWei = rewardInWei * BigInt(bottleCount);

    return Number(totalRewardWei) / 1e18;
  }, [selectedPackage, returnedCount, rewardPerBottle]);

  const rewardPerBottleDisplay = useMemo(() => {
    if (!rewardPerBottle) return "...";
    return Number(rewardPerBottle) / 1e18;
  }, [rewardPerBottle]);

  const validateForm = (): string | null => {
    if (!selectedPackageId) {
      return "Veuillez sélectionner un package";
    }

    if (!returnedCount || parseInt(returnedCount) <= 0) {
      return "Le nombre de bouteilles doit être supérieur à 0";
    }

    if (
      selectedPackage &&
      parseInt(returnedCount) > selectedPackage.bottleCount
    ) {
      return `Vous ne pouvez pas retourner plus de ${selectedPackage.bottleCount} bouteilles`;
    }

    return null;
  };

  const handleReturnBottles = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!boutTrackerAddress || !address) {
      setError("Contrat non déployé sur ce réseau ou wallet non connecté");
      return;
    }

    try {
      const packageData = await readContract(config, {
        address: chainsToBout[chainId]?.nft as Address,
        abi: boutNftAbi,
        functionName: "getPackage",
        args: [BigInt(selectedPackageId)],
      });

      const nftOwner = await readContract(config, {
        address: chainsToBout[chainId]?.nft as Address,
        abi: boutNftAbi,
        functionName: "ownerOf",
        args: [BigInt(selectedPackageId)],
      });

      const checks = {
        statusIsReceived: Number(packageData.status) === 1,
        userIsConsumer:
          packageData.consumer.toLowerCase() === address?.toLowerCase(),
        userOwnsNFT: nftOwner.toLowerCase() === address?.toLowerCase(),
        validReturnCount:
          parseInt(returnedCount) <= Number(packageData.bottleCount),
        returnCountPositive: parseInt(returnedCount) > 0,
      };

      const failedChecks = Object.entries(checks).filter(
        ([_, passed]) => !passed
      );
      if (failedChecks.length > 0) {
        const failedNames = failedChecks.map(([check]) => {
          switch (check) {
            case "statusIsReceived":
              return "Le package doit être en statut RECEIVED";
            case "userIsConsumer":
              return "Vous devez être le consumer assigné";
            case "userOwnsNFT":
              return "Vous devez posséder le NFT";
            case "validReturnCount":
              return "Nombre de bouteilles trop élevé";
            case "returnCountPositive":
              return "Nombre de bouteilles doit être positif";
            default:
              return check;
          }
        });
        setError(`Erreurs détectées: ${failedNames.join(", ")}`);
        return;
      }

      const tokenExists = await readContract(config, {
        address: boutTrackerAddress as Address,
        abi: boutTrackerAbi,
        functionName: "tokenExists",
        args: [BigInt(selectedPackageId)],
      });

      const packageStatus = await readContract(config, {
        address: chainsToBout[chainId]?.nft as Address,
        abi: boutNftAbi,
        functionName: "getPackageStatus",
        args: [BigInt(selectedPackageId)],
      });

      const isBanned = await readContract(config, {
        address: chainsToBout[chainId]?.nft as Address,
        abi: boutNftAbi,
        functionName: "isPackageBanned",
        args: [BigInt(selectedPackageId)],
      });

      const advancedChecks = {
        tokenExistsInTracker: tokenExists,
        packageStatusCorrect: Number(packageStatus) === 1,
        packageNotBanned: !isBanned,
      };

      const failedAdvancedChecks = Object.entries(advancedChecks).filter(
        ([_, passed]) => !passed
      );
      if (failedAdvancedChecks.length > 0) {
        const failedNames = failedAdvancedChecks.map(([check]) => {
          switch (check) {
            case "tokenExistsInTracker":
              return "Token non reconnu par le tracker";
            case "packageStatusCorrect":
              return "Statut package incorrect dans NFT";
            case "packageNotBanned":
              return "Package banni";
            default:
              return check;
          }
        });
        setError(`Erreurs avancées: ${failedNames.join(", ")}`);
        return;
      }

      setIsReturning(true);
      setError("");

      await writeContract({
        address: boutTrackerAddress as `0x${string}`,
        abi: boutTrackerAbi,
        functionName: "returnBottles",
        args: [BigInt(selectedPackageId), BigInt(returnedCount)],
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors du retour des bouteilles");
      setIsReturning(false);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      setIsReturning(false);
      setSelectedPackageId("");
      setReturnedCount("");
      onBottlesReturned();
      refetch();
    }
  }, [isConfirmed, onBottlesReturned, refetch]);

  const isLoading = isWriting || isConfirming || isReturning;

  return (
    <div className="bg-orange-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">
        ♻️ Retourner des Bouteilles
      </h2>

      {returnablePackages.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-2">📦</div>
          <div className="text-gray-600 font-medium mb-2">
            Aucun package à retourner
          </div>
          <div className="text-sm text-gray-500">
            Vous devez d'abord recevoir des packages pour pouvoir les retourner
          </div>
        </div>
      ) : (
        <>
          {(error || writeError) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-700 text-sm">
                <strong>❌ Erreur:</strong>
                <br />
                {error || writeError?.message || "Une erreur est survenue"}
              </div>
            </div>
          )}

          <form onSubmit={handleReturnBottles} className="space-y-4">
            <div>
              <label
                htmlFor="packageSelect"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                📦 Sélectionner le package à retourner
              </label>
              <select
                id="packageSelect"
                value={selectedPackageId}
                onChange={(e) => setSelectedPackageId(e.target.value)}
                disabled={isLoading}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500
                  ${isLoading ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
                `}
              >
                <option value="">-- Choisir un package --</option>
                {returnablePackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    Package #{pkg.id} - {pkg.packageLink} ({pkg.bottleCount}{" "}
                    bouteilles)
                  </option>
                ))}
              </select>
            </div>

            {selectedPackage && (
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <h3 className="font-medium text-gray-800 mb-2">
                  📋 Détails du package
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <strong>Package ID:</strong> #{selectedPackage.id}
                  </div>
                  <div>
                    <strong>Package Link:</strong> {selectedPackage.packageLink}
                  </div>
                  <div>
                    <strong>Bouteilles disponibles:</strong>{" "}
                    {selectedPackage.bottleCount}
                  </div>
                  <div>
                    <strong>Récompense par bouteille:</strong>{" "}
                    {rewardPerBottleDisplay} BOUT
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="returnedCount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                🔢 Nombre de bouteilles à retourner
              </label>
              <input
                type="number"
                id="returnedCount"
                value={returnedCount}
                onChange={(e) => setReturnedCount(e.target.value)}
                min="1"
                max={selectedPackage?.bottleCount || 100}
                disabled={isLoading || !selectedPackage}
                className={`
                  w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500
                  ${
                    isLoading || !selectedPackage
                      ? "bg-gray-100 cursor-not-allowed"
                      : "bg-white"
                  }
                `}
                placeholder="Ex: 3"
              />
              {selectedPackage && (
                <div className="text-xs text-gray-500 mt-1">
                  Maximum: {selectedPackage.bottleCount} bouteilles
                </div>
              )}
            </div>

            {estimatedReward > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">💰</span>
                  <div>
                    <div className="font-medium text-green-800">
                      Récompense estimée: {estimatedReward} BOUT tokens
                    </div>
                    <div className="text-sm text-green-600">
                      {returnedCount} bouteilles × {rewardPerBottleDisplay} BOUT
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !selectedPackage || !returnedCount}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
                ${
                  isLoading || !selectedPackage || !returnedCount
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-orange-500 hover:bg-orange-600 active:scale-95"
                }
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Retour en cours...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>♻️</span>
                  <span>Retourner les Bouteilles</span>
                </div>
              )}
            </button>
          </form>

          {hash && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-orange-700 text-sm">
                <strong>🚀 Transaction envoyée:</strong>
                <br />
                <code className="text-xs break-all font-mono bg-gray-100 p-1 rounded">
                  {hash}
                </code>
              </div>

              {isWriting && (
                <div className="text-orange-600 text-sm mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-orange-500 border-t-transparent mr-2"></div>
                  Envoi de la transaction...
                </div>
              )}

              {isConfirming && !isConfirmed && (
                <div className="text-blue-600 text-sm mt-2 flex items-center">
                  <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  ⏳ Attente de confirmation sur la blockchain...
                </div>
              )}

              {isConfirmed && (
                <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded">
                  <div className="text-green-700 text-sm font-semibold">
                    ✅ Bouteilles retournées avec succès !
                  </div>
                  <div className="text-green-600 text-xs mt-1">
                    Vos tokens seront disponibles après confirmation du supplier
                  </div>
                </div>
              )}

              {isTransactionError && transactionError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-red-600 text-sm font-semibold">
                    ❌ Transaction échouée !
                  </div>
                  <div className="text-red-600 text-xs mt-1">
                    {transactionError.message ||
                      "Vérifiez que vous possédez bien ce package"}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <div>
          <strong>💡 Comment ça marche :</strong>
        </div>
        <div>1. Sélectionnez un package que vous avez reçu</div>
        <div>2. Choisissez combien de bouteilles retourner</div>
        <div>3. Les bouteilles sont retournées au supplier</div>
        <div>4. Le supplier confirme le retour</div>
        <div>5. Vous recevez vos tokens BOUT en récompense !</div>
      </div>
    </div>
  );
}
