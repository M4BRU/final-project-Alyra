"use client";

import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { chainsToBout, boutTrackerAbi, boutTokenAbi } from "@/constants";
import { useChainId, useAccount } from "wagmi";

// ==========================================
// COURS : Props et Types
// ==========================================

/**
 * LEÇON 1 : Props du composant
 *
 * - onTokensWithdrawn: Callback pour notifier le parent que des tokens ont été retirés
 * - refetch: Fonction pour rafraîchir les données après retrait
 */

export interface WithdrawTokensProps {
  onTokensWithdrawn: () => void;
  refetch: () => void;
}

export default function WithdrawTokens({
  onTokensWithdrawn,
  refetch,
}: WithdrawTokensProps) {
  const chainId = useChainId();
  const { address } = useAccount();
  const boutTrackerAddress = chainsToBout[chainId]?.tracker;
  const boutTokenAddress = chainsToBout[chainId]?.token;

  // ==========================================
  // COURS : Hooks de lecture blockchain
  // ==========================================

  // Balance actuel de tokens (lecture directe)
  const {
    data: rawBalance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: boutTokenAddress as `0x${string}`,
    abi: boutTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!boutTokenAddress && !!address,
    },
  });

  // Récompenses retirables (lecture directe)
  const {
    data: rawWithdrawableRewards,
    isLoading: isLoadingRewards,
    refetch: refetchRewards,
  } = useReadContract({
    address: boutTrackerAddress as `0x${string}`,
    abi: boutTrackerAbi,
    functionName: "getWithdrawableRewards",
    args: address ? [address] : undefined,
    query: {
      enabled: !!boutTrackerAddress && !!address,
    },
  });

  // ==========================================
  // COURS : États du composant
  // ==========================================

  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [error, setError] = useState<string>("");

  // Conversion des valeurs wei → tokens
  const currentBalance = rawBalance ? Number(rawBalance) / 1e18 : 0;
  const withdrawableRewards = rawWithdrawableRewards
    ? Number(rawWithdrawableRewards) / 1e18
    : 0;
  const isLoading = isLoadingBalance || isLoadingRewards;

  // ==========================================
  // COURS : Hooks wagmi pour les transactions
  // ==========================================

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

  // ==========================================
  // COURS : Fonction de retrait
  // ==========================================

  /**
   * LEÇON 4 : Retrait des récompenses
   *
   * withdrawRewards() - fonction sans paramètres
   */

  const handleWithdrawRewards = async () => {
    console.log("=== WithdrawRewards Debug ===");
    console.log("withdrawableRewards:", withdrawableRewards);

    if (withdrawableRewards <= 0) {
      setError("Aucune récompense à retirer");
      return;
    }

    if (!boutTrackerAddress) {
      setError("Contrat non déployé sur ce réseau");
      return;
    }

    try {
      setIsWithdrawing(true);
      setError("");

      console.log("Calling withdrawRewards");

      // Appel de la fonction withdrawRewards du smart contract
      await writeContract({
        address: boutTrackerAddress as `0x${string}`,
        abi: boutTrackerAbi,
        functionName: "withdrawRewards",
        args: [], // Pas d'arguments
      });

      console.log("Transaction submitted successfully");
    } catch (err: any) {
      console.error("=== ERROR WithdrawRewards ===");
      console.error("Full error:", err);
      console.error("Error message:", err.message);
      console.error("========================");

      setError(err.message || "Erreur lors du retrait des récompenses");
      setIsWithdrawing(false);
    }
  };

  // ==========================================
  // COURS : Effects et reset
  // ==========================================

  // Reset après succès de transaction
  useEffect(() => {
    if (isConfirmed) {
      console.log("WithdrawTokens: Retrait confirmé avec succès!");
      setIsWithdrawing(false);

      // Rafraîchir les données directement avec wagmi
      refetchBalance();
      refetchRewards();

      // Notifier le parent
      onTokensWithdrawn();
      refetch();
    }
  }, [isConfirmed, refetchBalance, refetchRewards, onTokensWithdrawn, refetch]);

  // Debug: Log des valeurs en temps réel
  useEffect(() => {
    console.log("=== WithdrawTokens Data Debug ===");
    console.log("rawBalance:", rawBalance);
    console.log("rawWithdrawableRewards:", rawWithdrawableRewards);
    console.log("currentBalance:", currentBalance);
    console.log("withdrawableRewards:", withdrawableRewards);
    console.log("=================================");
  }, [rawBalance, rawWithdrawableRewards, currentBalance, withdrawableRewards]);

  // État de loading global
  const isTransactionLoading = isWriting || isConfirming || isWithdrawing;

  // ==========================================
  // COURS : Interface utilisateur
  // ==========================================

  return (
    <div className="bg-green-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">💰 Mes Tokens BOUT</h2>

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <div className="text-gray-600">Chargement des données...</div>
        </div>
      ) : (
        <>
          {/* Affichage des balances */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Balance actuel */}
            <div className="bg-white p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <span className="text-lg">🪙</span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Balance actuel</div>
                  <div className="text-xl font-semibold text-green-600">
                    {currentBalance.toFixed(2)} BOUT
                  </div>
                </div>
              </div>
            </div>

            {/* Récompenses disponibles */}
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 p-2 rounded-full">
                  <span className="text-lg">🎁</span>
                </div>
                <div>
                  <div className="text-sm text-gray-500">
                    Récompenses disponibles
                  </div>
                  <div className="text-xl font-semibold text-orange-600">
                    {withdrawableRewards.toFixed(2)} BOUT
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section de retrait */}
          {withdrawableRewards > 0 ? (
            <div className="bg-white p-6 rounded-lg border border-green-200">
              <h3 className="font-medium text-gray-800 mb-4">
                🚀 Retirer mes récompenses
              </h3>

              {/* Affichage des erreurs */}
              {(error || writeError) && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-red-700">
                    {error || "Une erreur est survenue"}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mb-4">
                <div>
                  <div className="font-medium text-green-800">
                    Vous pouvez retirer {withdrawableRewards.toFixed(2)} BOUT
                    tokens
                  </div>
                  <div className="text-sm text-green-600">
                    Ces récompenses proviennent de vos retours de bouteilles
                    confirmés
                  </div>
                </div>
                <div className="text-2xl">💎</div>
              </div>

              {/* Bouton de retrait */}
              <button
                onClick={handleWithdrawRewards}
                disabled={isTransactionLoading || withdrawableRewards <= 0}
                className={`
                  w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
                  ${
                    isTransactionLoading || withdrawableRewards <= 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-500 hover:bg-green-600 active:scale-95"
                  }
                `}
              >
                {isTransactionLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Retrait en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>💰</span>
                    <span>Retirer {withdrawableRewards.toFixed(2)} BOUT</span>
                  </div>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-gray-600 font-medium mb-2">
                Aucune récompense disponible
              </div>
              <div className="text-sm text-gray-500">
                Retournez des bouteilles et attendez la confirmation des
                suppliers pour gagner des tokens
              </div>
            </div>
          )}

          {/* Statut de la transaction */}
          {hash && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-green-700 text-sm">
                <strong>🚀 Transaction envoyée:</strong>
                <br />
                <code className="text-xs break-all font-mono bg-gray-100 p-1 rounded">
                  {hash}
                </code>
              </div>

              {isWriting && (
                <div className="text-green-600 text-sm mt-2 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-green-500 border-t-transparent mr-2"></div>
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
                    ✅ Tokens retirés avec succès !
                  </div>
                  <div className="text-green-600 text-xs mt-1">
                    Vos tokens BOUT sont maintenant dans votre wallet
                  </div>
                </div>
              )}

              {isTransactionError && transactionError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <div className="text-red-600 text-sm font-semibold">
                    ❌ Transaction échouée !
                  </div>
                  <div className="text-red-600 text-xs mt-1">
                    Vérifiez que vous avez des récompenses à retirer
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Info utile */}
      <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <div>
          <strong>💡 Comment ça marche :</strong>
        </div>
        <div>
          1. Vous retournez des bouteilles (gain de récompenses en attente)
        </div>
        <div>
          2. Le supplier confirme le retour (récompenses deviennent retirables)
        </div>
        <div>3. Vous retirez vos tokens BOUT dans votre wallet</div>
        <div>4. Vous pouvez utiliser vos tokens ou les échanger !</div>
      </div>
    </div>
  );
}
