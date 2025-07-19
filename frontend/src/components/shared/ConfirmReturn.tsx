"use client";

import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useConfig,
} from "wagmi";
import { chainsToBout, boutTrackerAbi, boutNftAbi } from "@/constants";
import { useChainId } from "wagmi";
import { readContract } from "@wagmi/core";
import { Address } from "viem";

export interface ConfirmReturnProps {
  onReturnConfirmed: () => void;
  refetch: () => void;
  supplierPackages?: Array<{
    id: number;
    consumer?: string;
    status: number;
    rewardAmount: number;
    bottleCount: number;
    packageLink: string;
  }>;
}

export default function ConfirmReturn({
  onReturnConfirmed,
  refetch,
  supplierPackages = [],
}: ConfirmReturnProps) {
  const chainId = useChainId();
  const config = useConfig();
  const boutTrackerAddress = chainsToBout[chainId]?.tracker;

  const [confirmingPackageId, setConfirmingPackageId] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string>("");
  const [packageDetails, setPackageDetails] = useState<{ [key: number]: any }>(
    {}
  );

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

  const pendingConfirmationPackages = supplierPackages.filter(
    (pkg) => pkg.status === 2
  );

  const fetchPackageDetails = async () => {
    if (pendingConfirmationPackages.length === 0) return;

    try {
      const details: { [key: number]: any } = {};

      for (const pkg of pendingConfirmationPackages) {
        try {
          const packageData = await readContract(config, {
            address: chainsToBout[chainId]?.nft as Address,
            abi: boutNftAbi,
            functionName: "getPackage",
            args: [BigInt(pkg.id)],
          });

          details[pkg.id] = {
            ...packageData,
            returnedCount: Number(packageData.returnedCount),
            bottleCount: Number(packageData.bottleCount),
          };
        } catch (error) {
          console.error(`Erreur pour package ${pkg.id}:`, error);
        }
      }

      setPackageDetails(details);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error);
    }
  };

  useEffect(() => {
    fetchPackageDetails();
  }, [pendingConfirmationPackages.length]);

  const handleConfirmReturn = async (packageId: number) => {
    if (!boutTrackerAddress) {
      setError("Contrat non déployé sur ce réseau");
      return;
    }

    try {
      setConfirmingPackageId(packageId);
      setError("");

      await writeContract({
        address: boutTrackerAddress as `0x${string}`,
        abi: boutTrackerAbi,
        functionName: "confirmReturn",
        args: [BigInt(packageId)],
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors de la confirmation");
      setConfirmingPackageId(null);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      setConfirmingPackageId(null);

      setTimeout(() => {
        fetchPackageDetails();
      }, 1000);

      onReturnConfirmed();
      refetch();
    }
  }, [isConfirmed, onReturnConfirmed, refetch]);

  const isPackageLoading = (packageId: number) => {
    return confirmingPackageId === packageId && (isWriting || isConfirming);
  };

  return (
    <div className="bg-purple-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">✅ Confirmer les Retours</h2>

      {pendingConfirmationPackages.length === 0 ? (
        <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-4xl mb-2">📋</div>
          <div className="text-gray-600 font-medium mb-2">
            Aucun retour en attente
          </div>
          <div className="text-sm text-gray-500">
            Les consumers doivent d'abord retourner des packages pour que vous
            puissiez les confirmer
          </div>
        </div>
      ) : (
        <>
          {(error || writeError) && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-700">
                {error || "Une erreur est survenue"}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {pendingConfirmationPackages.map((pkg) => {
              const details = packageDetails[pkg.id];
              const returnedCount = details?.returnedCount || 0;
              const totalBottles = details?.bottleCount || pkg.bottleCount;

              return (
                <div
                  key={pkg.id}
                  className="bg-white p-4 rounded-lg border border-purple-200 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="bg-purple-100 p-2 rounded-full">
                        <span className="text-lg">📦</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">
                          Package #{pkg.id}
                        </h3>
                        <div className="text-sm text-gray-500">
                          Retourné par:{" "}
                          {pkg.consumer
                            ? `${pkg.consumer.slice(
                                0,
                                6
                              )}...${pkg.consumer.slice(-4)}`
                            : "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                      ⏳ En attente de confirmation
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 text-sm">
                    <div>
                      <div className="text-gray-500">Package Link</div>
                      <div className="font-medium text-blue-600">
                        {pkg.packageLink}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Bouteilles retournées</div>
                      <div className="font-medium text-orange-600">
                        {returnedCount} / {totalBottles}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Récompense/bouteille</div>
                      <div className="font-medium">{pkg.rewardAmount} BOUT</div>
                    </div>
                    <div>
                      <div className="text-gray-500">
                        Récompense à confirmer
                      </div>
                      <div className="font-medium text-green-600">
                        {pkg.rewardAmount * returnedCount} BOUT
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Action requise</div>
                      <div className="font-medium text-purple-600">
                        Confirmation
                      </div>
                    </div>
                  </div>

                  {details && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                      <div className="font-medium text-gray-700 mb-2">
                        📋 Détails du retour :
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <span className="text-gray-500">
                            Bouteilles envoyées:
                          </span>
                          <span className="ml-2 font-medium">
                            {totalBottles}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">
                            Bouteilles retournées:
                          </span>
                          <span className="ml-2 font-medium text-orange-600">
                            {returnedCount}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Taux de retour:</span>
                          <span className="ml-2 font-medium text-purple-600">
                            {totalBottles > 0
                              ? Math.round((returnedCount / totalBottles) * 100)
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleConfirmReturn(pkg.id)}
                      disabled={isPackageLoading(pkg.id)}
                      className={`
                        px-6 py-2 rounded-lg font-semibold text-white transition-all
                        ${
                          isPackageLoading(pkg.id)
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-purple-500 hover:bg-purple-600 active:scale-95"
                        }
                      `}
                    >
                      {isPackageLoading(pkg.id) ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Confirmation...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span>✅</span>
                          <span>
                            Confirmer le Retour ({returnedCount} bouteilles)
                          </span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {hash && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="text-purple-700 text-sm">
                <strong>🚀 Transaction envoyée:</strong>
                <br />
                <code className="text-xs break-all font-mono bg-gray-100 p-1 rounded">
                  {hash}
                </code>
              </div>

              {isWriting && (
                <div className="text-purple-600 text-sm mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-purple-500 border-t-transparent mr-2"></div>
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
                    ✅ Retour confirmé avec succès !
                  </div>
                  <div className="text-green-600 text-xs mt-1">
                    Les tokens sont maintenant disponibles pour le consumer
                  </div>
                </div>
              )}

              {isTransactionError && transactionError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-red-600 text-sm font-semibold">
                    ❌ Transaction échouée !
                  </div>
                  <div className="text-red-600 text-xs mt-1">
                    Vérifiez que ce package existe et est en statut RETURNED
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
        <div>
          1. Les consumers retournent leurs packages (status → RETURNED)
        </div>
        <div>2. Vous confirmez que le retour est correct</div>
        <div>3. Les récompenses sont libérées pour le consumer</div>
        <div>4. Le package passe en status CONFIRMED (archivé)</div>
      </div>
    </div>
  );
}
