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
 * - onPackageCreated: Callback pour notifier le parent qu'un package a été créé
 * - refetch: Fonction pour rafraîchir les données après création
 */

interface CreatePackageProps {
  onPackageCreated: () => void;
  refetch: () => void;
}

export default function CreatePackage({
  onPackageCreated,
  refetch,
}: CreatePackageProps) {
  const chainId = useChainId();
  const boutTrackerAddress = chainsToBout[chainId]?.tracker;

  // ==========================================
  // COURS : États du formulaire
  // ==========================================

  /**
   * LEÇON 2 : Gestion des états de formulaire
   *
   * - bottleCount: Nombre de bouteilles dans le package
   * - packageLink: Lien/ID du package (simule le QR code)
   * - intendedConsumer: Adresse du consumer assigné
   * - isCreating: État de loading pendant création
   * - error: Gestion des erreurs
   */

  const [bottleCount, setBottleCount] = useState<string>("");
  const [packageLink, setPackageLink] = useState<string>("");
  const [intendedConsumer, setIntendedConsumer] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
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

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  // ==========================================
  // COURS : Validation des données
  // ==========================================

  /**
   * LEÇON 3 : Validation côté client
   *
   * Toujours valider les données avant d'envoyer à la blockchain
   * pour éviter les transactions qui échouent (et qui coûtent du gas)
   */

  const validateForm = (): string | null => {
    if (!bottleCount || parseInt(bottleCount) <= 0) {
      return "Le nombre de bouteilles doit être supérieur à 0";
    }

    if (!packageLink.trim()) {
      return "Le lien du package est requis";
    }

    if (!intendedConsumer.trim()) {
      return "L'adresse du consumer est requise";
    }

    // Validation basique d'adresse Ethereum
    if (!intendedConsumer.match(/^0x[a-fA-F0-9]{40}$/)) {
      return "L'adresse du consumer n'est pas valide";
    }

    return null;
  };

  // ==========================================
  // COURS : Fonction de création de package
  // ==========================================

  /**
   * LEÇON 4 : Appel de smart contract avec plusieurs paramètres
   *
   * createPackage(bottleCount, packageLink, intendedConsumer)
   */

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!boutTrackerAddress) {
      setError("Contrat non déployé sur ce réseau");
      return;
    }

    try {
      setIsCreating(true);
      setError("");

      // Appel de la fonction createPackage du smart contract
      await writeContract({
        address: boutTrackerAddress as `0x${string}`,
        abi: boutTrackerAbi,
        functionName: "createPackage",
        args: [
          BigInt(bottleCount), // uint256 bottleCount
          packageLink, // string packageLink
          intendedConsumer as `0x${string}`, // address intendedConsumer
        ],
      });
    } catch (err: any) {
      console.error("Erreur lors de la création du package:", err);
      setError(err.message || "Erreur lors de la création du package");
      setIsCreating(false);
    }
  };

  // ==========================================
  // COURS : Reset du formulaire après succès
  // ==========================================

  /**
   * LEÇON 5 : Réinitialiser le formulaire après succès
   */

  // Debug: Log des états wagmi
  useEffect(() => {
    console.log("=== CreatePackage Debug ===");
    console.log("hash:", hash);
    console.log("isWriting:", isWriting);
    console.log("isConfirming:", isConfirming);
    console.log("isConfirmed:", isConfirmed);
    console.log("writeError:", writeError);
    console.log("========================");
  }, [hash, isWriting, isConfirming, isConfirmed, writeError]);

  useEffect(() => {
    console.log("CreatePackage: isConfirmed changed to", isConfirmed);
    if (isConfirmed) {
      console.log("CreatePackage: Package confirmed, resetting form...");
      setIsCreating(false);

      // Reset du formulaire
      setBottleCount("");
      setPackageLink("");
      setIntendedConsumer("");

      // Notifier le parent
      console.log("CreatePackage: Calling onPackageCreated and refetch...");
      onPackageCreated();
      refetch();
    }
  }, [isConfirmed, onPackageCreated, refetch]); // ✅ Maintenant stable

  // État de loading global
  const isLoading = isWriting || isConfirming || isCreating;

  // ==========================================
  // COURS : Rendu du formulaire
  // ==========================================

  return (
    <div className="bg-blue-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Créer un Package</h2>

      {/* Affichage des erreurs */}
      {(error || writeError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">
            {error || writeError?.message || "Une erreur est survenue"}
          </p>
        </div>
      )}

      <form onSubmit={handleCreatePackage} className="space-y-4">
        {/* Champ Nombre de bouteilles */}
        <div>
          <label
            htmlFor="bottleCount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre de bouteilles
          </label>
          <input
            type="number"
            id="bottleCount"
            value={bottleCount}
            onChange={(e) => setBottleCount(e.target.value)}
            min="1"
            max="100"
            disabled={isLoading}
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isLoading ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
            `}
            placeholder="Ex: 5"
          />
          <p className="text-xs text-gray-500 mt-1">
            Nombre de bouteilles/emballages dans ce package
          </p>
        </div>

        {/* Champ Lien du package */}
        <div>
          <label
            htmlFor="packageLink"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Lien du package (simule QR code)
          </label>
          <input
            type="text"
            id="packageLink"
            value={packageLink}
            onChange={(e) => setPackageLink(e.target.value)}
            disabled={isLoading}
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isLoading ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
            `}
            placeholder="Ex: package-123-abc"
          />
          <p className="text-xs text-gray-500 mt-1">
            Identifiant unique du package (dans un vrai projet, ce serait un QR
            code)
          </p>
        </div>

        {/* Champ Consumer assigné */}
        <div>
          <label
            htmlFor="intendedConsumer"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Adresse du consumer assigné
          </label>
          <input
            type="text"
            id="intendedConsumer"
            value={intendedConsumer}
            onChange={(e) => setIntendedConsumer(e.target.value)}
            disabled={isLoading}
            className={`
              w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
              ${isLoading ? "bg-gray-100 cursor-not-allowed" : "bg-white"}
            `}
            placeholder="0x..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Adresse Ethereum du consumer qui recevra ce package
          </p>
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
                : "bg-blue-500 hover:bg-blue-600 active:scale-95"
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Création en cours...</span>
            </div>
          ) : (
            "Créer le Package"
          )}
        </button>
      </form>

      {/* Statut de la transaction - Version améliorée */}
      {hash && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            <strong>🚀 Transaction envoyée:</strong>
            <br />
            <code className="text-xs break-all font-mono bg-gray-100 p-1 rounded">
              {hash}
            </code>
          </p>

          {isWriting && (
            <div className="text-blue-600 text-sm mt-2 flex items-center">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent mr-2"></div>
              Envoi de la transaction...
            </div>
          )}

          {isConfirming && !isConfirmed && (
            <div className="text-orange-600 text-sm mt-2 flex items-center">
              <div className="animate-pulse w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              ⏳ Attente de confirmation sur la blockchain... (peut prendre
              quelques secondes)
            </div>
          )}

          {isConfirmed && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
              <div className="text-green-600 text-sm font-semibold">
                ✅ Package créé avec succès !
              </div>
              <div className="text-green-600 text-xs mt-1">
                Le formulaire va se réinitialiser automatiquement
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info utile */}
      <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p>
          <strong>💡 Comment ça marche :</strong>
        </p>
        <p>1. Vous créez un package avec un nombre de bouteilles</p>
        <p>2. Vous assignez un consumer qui pourra le recevoir</p>
        <p>
          3. Le consumer pourra scanner le "QR code" (lien) pour récupérer le
          package
        </p>
      </div>
    </div>
  );
}
