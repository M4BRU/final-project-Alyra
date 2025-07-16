"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { chainsToBout, boutTrackerAbi, UserRole } from "@/constants";
import { useChainId } from "wagmi";

// ==========================================
// COURS : Props et Types
// ==========================================

/**
 * LEÇON 1 : Props du composant
 *
 * - onRegistrationSuccess: Callback pour notifier le parent quand l'inscription réussit
 * - refetch: Fonction pour rafraîchir les données après inscription
 */

interface RegisterUserProps {
  onRegistrationSuccess: () => void;
  refetch: () => void;
}

export default function RegisterUser({
  onRegistrationSuccess,
  refetch,
}: RegisterUserProps) {
  const chainId = useChainId();
  const boutTrackerAddress = chainsToBout[chainId]?.tracker;

  // ==========================================
  // COURS : États du composant
  // ==========================================

  /**
   * LEÇON 2 : Gestion des états
   *
   * - selectedRole: Le rôle choisi par l'utilisateur
   * - isRegistering: Pour afficher un loading pendant la transaction
   * - error: Pour afficher les erreurs
   */

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string>("");

  // ==========================================
  // COURS : Hooks wagmi pour les transactions
  // ==========================================

  /**
   * LEÇON 3 : useWriteContract
   *
   * Ce hook permet d'appeler les fonctions de smart contract qui modifient l'état
   * (functions avec stateMutability: "nonpayable")
   */

  const {
    writeContract,
    data: hash,
    isPending: isWriting,
    error: writeError,
  } = useWriteContract();

  /**
   * LEÇON 4 : useWaitForTransactionReceipt
   *
   * Ce hook attend que la transaction soit confirmée sur la blockchain
   */

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // ==========================================
  // COURS : Fonction d'inscription
  // ==========================================

  /**
   * LEÇON 5 : Pattern d'appel de smart contract
   *
   * 1. Validation des données
   * 2. Appel writeContract avec les bons paramètres
   * 3. Gestion des erreurs
   * 4. Feedback utilisateur
   */

  const handleRegisterSupplier = async () => {
    if (!boutTrackerAddress) {
      setError("Contrat non déployé sur ce réseau");
      return;
    }

    try {
      setIsRegistering(true);
      setError("");
      setSelectedRole(UserRole.SUPPLIER);

      await writeContract({
        address: boutTrackerAddress as `0x${string}`,
        abi: boutTrackerAbi,
        functionName: "registerAsSupplier",
        args: [], // Pas d'arguments !
      });
    } catch (err: any) {
      console.error("Erreur lors de l'inscription supplier:", err);
      setError(err.message || "Erreur lors de l'inscription");
      setIsRegistering(false);
    }
  };

  const handleRegisterConsumer = async () => {
    if (!boutTrackerAddress) {
      setError("Contrat non déployé sur ce réseau");
      return;
    }

    try {
      setIsRegistering(true);
      setError("");
      setSelectedRole(UserRole.CONSUMER);

      await writeContract({
        address: boutTrackerAddress as `0x${string}`,
        abi: boutTrackerAbi,
        functionName: "registerAsConsumer",
        args: [], // Pas d'arguments !
      });
    } catch (err: any) {
      console.error("Erreur lors de l'inscription consumer:", err);
      setError(err.message || "Erreur lors de l'inscription");
      setIsRegistering(false);
    }
  };

  // ==========================================
  // COURS : Effet de fin de transaction
  // ==========================================

  /**
   * LEÇON 6 : Callback automatique après confirmation
   *
   * Quand isConfirmed devient true, on notifie le parent
   */

  useEffect(() => {
    if (isConfirmed) {
      setIsRegistering(false);
      onRegistrationSuccess();
      refetch(); // Rafraîchir les données du parent
    }
  }, [isConfirmed, onRegistrationSuccess, refetch]);

  // État de loading global
  const isLoading = isWriting || isConfirming || isRegistering;

  // ==========================================
  // COURS : Rendu conditionnel
  // ==========================================

  return (
    <div className="space-y-6">
      <div className="text-center p-8 bg-white rounded-lg border">
        <h2 className="text-2xl font-bold mb-4">Inscription au système BOUT</h2>
        <p className="text-gray-600 mb-6">
          Choisissez votre rôle pour commencer à utiliser BOUT
        </p>

        {/* Affichage des erreurs */}
        {(error || writeError) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">
              {error || writeError?.message || "Une erreur est survenue"}
            </p>
          </div>
        )}

        {/* Boutons d'inscription */}
        <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
          {/* Bouton SUPPLIER */}
          <button
            onClick={handleRegisterSupplier}
            disabled={isLoading}
            className={`
              w-full md:w-auto px-8 py-4 rounded-lg font-semibold text-white transition-all
              ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 active:scale-95"
              }
              ${
                selectedRole === UserRole.SUPPLIER && isLoading
                  ? "ring-2 ring-blue-300"
                  : ""
              }
            `}
          >
            {selectedRole === UserRole.SUPPLIER && isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Inscription en cours...</span>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg">📦 SUPPLIER</div>
                <div className="text-sm opacity-90">
                  Créer et gérer des packages
                </div>
              </div>
            )}
          </button>

          {/* Bouton CONSUMER */}
          <button
            onClick={handleRegisterConsumer}
            disabled={isLoading}
            className={`
              w-full md:w-auto px-8 py-4 rounded-lg font-semibold text-white transition-all
              ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600 active:scale-95"
              }
              ${
                selectedRole === UserRole.CONSUMER && isLoading
                  ? "ring-2 ring-green-300"
                  : ""
              }
            `}
          >
            {selectedRole === UserRole.CONSUMER && isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Inscription en cours...</span>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-lg">♻️ CONSUMER</div>
                <div className="text-sm opacity-90">
                  Recevoir et retourner des packages
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Statut de la transaction */}
        {hash && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>Transaction envoyée:</strong>
              <br />
              <code className="text-xs break-all">{hash}</code>
            </p>
            {isConfirming && (
              <p className="text-blue-600 text-sm mt-2">
                ⏳ Attente de confirmation sur la blockchain...
              </p>
            )}
            {isConfirmed && (
              <p className="text-green-600 text-sm mt-2">
                ✅ Inscription confirmée ! Redirection...
              </p>
            )}
          </div>
        )}

        {/* Info sur les rôles */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            <strong>SUPPLIER:</strong> Vous pourrez créer des packages
            d'emballages et confirmer leur retour
          </p>
          <p>
            <strong>CONSUMER:</strong> Vous pourrez recevoir des packages et les
            retourner pour gagner des tokens
          </p>
        </div>
      </div>
    </div>
  );
}
