"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { chainsToBout, boutTrackerAbi } from "@/constants";
import { useChainId } from "wagmi";

// ==========================================
// COURS : Props et Types
// ==========================================

/**
 * LEÇON 1 : Props du composant
 *
 * - onPackageReceived: Callback pour notifier le parent qu'un package a été reçu
 * - refetch: Fonction pour rafraîchir les données après réception
 */

export interface ReceivePackageProps {
  onPackageReceived: () => void;
  refetch: () => void;
}

export default function ReceivePackage({
  onPackageReceived,
  refetch,
}: ReceivePackageProps) {
  const chainId = useChainId();
  const boutTrackerAddress = chainsToBout[chainId]?.tracker;

  // ==========================================
  // COURS : États du formulaire
  // ==========================================

  /**
   * LEÇON 2 : Interface simple - Un seul champ
   *
   * - packageLink: Le lien/ID du package (simule le scan QR)
   * - isReceiving: État de loading pendant réception
   * - error: Gestion des erreurs
   */

  const [packageLink, setPackageLink] = useState<string>("");
  const [isReceiving, setIsReceiving] = useState(false);
  const [error, setError] = useState<string>("");

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
  // COURS : Validation simple
  // ==========================================

  /**
   * LEÇON 3 : Validation basique pour packageLink
   */

  const validateForm = (): string | null => {
    if (!packageLink.trim()) {
      return "Le lien du package est requis";
    }

    if (packageLink.length < 3) {
      return "Le lien du package semble trop court";
    }

    return null;
  };

  // ==========================================
  // COURS : Fonction de réception de package
  // ==========================================

  /**
   * LEÇON 4 : Appel simple avec un seul paramètre
   *
   * receivePackage(packageLink) - string uniquement
   */

  const handleReceivePackage = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("=== ReceivePackage Debug ===");
    console.log("packageLink:", packageLink);
    console.log("boutTrackerAddress:", boutTrackerAddress);

    // Validation
    const validationError = validateForm();
    if (validationError) {
      console.log("Validation error:", validationError);
      setError(validationError);
      return;
    }

    if (!boutTrackerAddress) {
      setError("Contrat non déployé sur ce réseau");
      return;
    }

    try {
      setIsReceiving(true);
      setError("");

      console.log("Calling receivePackage with:", packageLink.trim());

      // Appel de la fonction receivePackage du smart contract
      await writeContract({
        address: boutTrackerAddress as `0x${string}`,
        abi: boutTrackerAbi,
        functionName: "receivePackage",
        args: [packageLink.trim()], // Un seul argument: string packageLink
      });

      console.log("Transaction submitted successfully");
    } catch (err: any) {
      console.error("=== ERROR ReceivePackage ===");
      console.error("Full error:", err);
      console.error("Error message:", err.message);
      console.error("Error cause:", err.cause);
      console.error("========================");

      setError(err.message || "Erreur lors de la réception du package");
      setIsReceiving(false);
    }
  };

  // ==========================================
  // COURS : Reset après succès
  // ==========================================

  // Debug: Log des états wagmi
  useEffect(() => {
    console.log("=== ReceivePackage Wagmi States ===");
    console.log("hash:", hash);
    console.log("isWriting:", isWriting);
    console.log("isConfirming:", isConfirming);
    console.log("isConfirmed:", isConfirmed);
    console.log("isTransactionError:", isTransactionError);
    console.log("transactionError:", transactionError);
    console.log("writeError:", writeError);
    console.log("=================================");
  }, [
    hash,
    isWriting,
    isConfirming,
    isConfirmed,
    isTransactionError,
    transactionError,
    writeError,
  ]);

  useEffect(() => {
    if (isConfirmed) {
      console.log("ReceivePackage: Package reçu avec succès!");
      setIsReceiving(false);

      // Reset du formulaire
      setPackageLink("");

      // Notifier le parent
      onPackageReceived();
      refetch();
    }
  }, [isConfirmed]); // ✅ Seulement isConfirmed comme dépendance

  // État de loading global
  const isLoading = isWriting || isConfirming || isReceiving;

  // ==========================================
  // COURS : Interface "scan QR code"
  // ==========================================

  return (
    <div className="bg-green-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">📱 Recevoir un Package</h2>

      {/* Simulation QR Scanner */}
      <div className="mb-4 p-4 bg-white border-2 border-dashed border-green-300 rounded-lg text-center">
        <div className="text-4xl mb-2">📱</div>
        <div className="text-green-700 font-medium">
          Simulateur de Scan QR Code
        </div>
        <div className="text-sm text-gray-600">
          Dans un vrai projet, ici il y aurait une caméra pour scanner le QR
          code
        </div>
      </div>

      {/* Affichage des erreurs */}
      {(error || writeError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-700">
            {error || "Une erreur est survenue"}
          </div>
        </div>
      )}

      <form onSubmit={handleReceivePackage} className="space-y-4">
        {/* Champ Package Link */}
        <div>
          <label
            htmlFor="packageLink"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            🔗 Lien du package (simule le résultat du scan QR)
          </label>
          <input
            type="text"
            id="packageLink"
            value={packageLink}
            onChange={(e) => setPackageLink(e.target.value)}
            disabled={isLoading}
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500
              ${isLoading ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
            `}
            placeholder="Ex: package-123-abc"
          />
          <div className="text-xs text-gray-500 mt-1">
            💡 Demandez le lien du package au supplier, ou utilisez celui qu'il
            a créé
          </div>
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
            ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 active:scale-95"
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Réception en cours...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <span>📦</span>
              <span>Recevoir le Package</span>
            </div>
          )}
        </button>
      </form>

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
            <div className="text-orange-600 text-sm mt-2 flex items-center">
              <div className="animate-pulse w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              ⏳ Attente de confirmation sur la blockchain...
            </div>
          )}

          {isConfirmed && (
            <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded">
              <div className="text-green-700 text-sm font-semibold">
                ✅ Package reçu avec succès !
              </div>
              <div className="text-green-600 text-xs mt-1">
                Le package est maintenant en votre possession
              </div>
            </div>
          )}

          {isTransactionError && transactionError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
              <div className="text-red-600 text-sm font-semibold">
                ❌ Transaction échouée !
              </div>
              <div className="text-red-600 text-xs mt-1">
                Raison: {JSON.stringify(transactionError, null, 2)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info utile */}
      <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <div>
          <strong>💡 Comment ça marche :</strong>
        </div>
        <div>1. Le supplier crée un package avec un lien unique</div>
        <div>2. Vous entrez ce lien (normalement via scan QR code)</div>
        <div>3. Le package est transféré vers votre wallet</div>
        <div>
          4. Vous pouvez maintenant l'utiliser et le retourner pour gagner des
          tokens
        </div>
      </div>
    </div>
  );
}
