"use client";

import { useState, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useConfig,
} from "wagmi";
import { chainsToBout, boutTrackerAbi } from "@/constants";
import { useChainId } from "wagmi";
import { readContract } from "@wagmi/core";
import { Address } from "viem";

interface CreatePackageProps {
  onPackageCreated: () => void;
  refetch: () => void;
}

export default function CreatePackage({
  onPackageCreated,
  refetch,
}: CreatePackageProps) {
  const chainId = useChainId();
  const config = useConfig();
  const boutTrackerAddress = chainsToBout[chainId]?.tracker;

  const [bottleCount, setBottleCount] = useState<string>("");
  const [packageLink, setPackageLink] = useState<string>("");
  const [intendedConsumer, setIntendedConsumer] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");

  const [isValidatingConsumer, setIsValidatingConsumer] = useState(false);
  const [consumerValidationStatus, setConsumerValidationStatus] = useState<
    "idle" | "valid" | "invalid" | "not_registered"
  >("idle");

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

  const validateConsumerAddress = async (address: string) => {
    if (!boutTrackerAddress || !address) {
      setConsumerValidationStatus("idle");
      return;
    }

    if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
      setConsumerValidationStatus("invalid");
      return;
    }

    try {
      setIsValidatingConsumer(true);
      setConsumerValidationStatus("idle");

      // Appeler directement isConsumer() du smart contract
      const isValidConsumer = await readContract(config, {
        address: boutTrackerAddress as Address,
        abi: boutTrackerAbi,
        functionName: "isConsumer",
        args: [address as Address],
      });

      if (isValidConsumer) {
        setConsumerValidationStatus("valid");
      } else {
        // Vérifier si l'adresse est enregistrée pour distinguer les cas
        const isRegistered = await readContract(config, {
          address: boutTrackerAddress as Address,
          abi: boutTrackerAbi,
          functionName: "isRegistered",
          args: [address as Address],
        });

        if (isRegistered) {
          setConsumerValidationStatus("invalid"); // Enregistré mais pas consumer
        } else {
          setConsumerValidationStatus("not_registered"); // Pas enregistré du tout
        }
      }
    } catch (error) {
      setConsumerValidationStatus("invalid");
    } finally {
      setIsValidatingConsumer(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (intendedConsumer.trim()) {
        validateConsumerAddress(intendedConsumer.trim());
      } else {
        setConsumerValidationStatus("idle");
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [intendedConsumer]);

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

    if (!intendedConsumer.match(/^0x[a-fA-F0-9]{40}$/)) {
      return "L'adresse du consumer n'est pas valide";
    }

    if (consumerValidationStatus === "not_registered") {
      return "Cette adresse n'est pas enregistrée dans le système";
    }

    if (consumerValidationStatus === "invalid") {
      return "Cette adresse n'est pas un consumer valide";
    }

    if (consumerValidationStatus !== "valid") {
      return "Veuillez attendre la validation de l'adresse consumer";
    }

    return null;
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();

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

      await writeContract({
        address: boutTrackerAddress as `0x${string}`,
        abi: boutTrackerAbi,
        functionName: "createPackage",
        args: [
          BigInt(bottleCount),
          packageLink,
          intendedConsumer as `0x${string}`,
        ],
      });
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du package");
      setIsCreating(false);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      setIsCreating(false);
      setBottleCount("");
      setPackageLink("");
      setIntendedConsumer("");
      setConsumerValidationStatus("idle");
      onPackageCreated();
      refetch();
    }
  }, [isConfirmed, onPackageCreated, refetch]);

  const isLoading = isWriting || isConfirming || isCreating;

  // Fonction pour obtenir le style et message de validation
  const getConsumerValidationDisplay = () => {
    if (!intendedConsumer.trim()) {
      return {
        style: "border-gray-300",
        message: null,
        icon: null,
      };
    }

    if (isValidatingConsumer) {
      return {
        style: "border-blue-300 bg-blue-50",
        message: "Validation en cours...",
        icon: "🔍",
      };
    }

    switch (consumerValidationStatus) {
      case "valid":
        return {
          style: "border-green-300 bg-green-50",
          message: "Consumer valide ✅",
          icon: "✅",
        };
      case "invalid":
        return {
          style: "border-red-300 bg-red-50",
          message: "Cette adresse n'est pas un consumer",
          icon: "❌",
        };
      case "not_registered":
        return {
          style: "border-orange-300 bg-orange-50",
          message: "Adresse non enregistrée dans le système",
          icon: "⚠️",
        };
      default:
        if (!intendedConsumer.match(/^0x[a-fA-F0-9]{40}$/)) {
          return {
            style: "border-red-300 bg-red-50",
            message: "Format d'adresse invalide",
            icon: "❌",
          };
        }
        return {
          style: "border-gray-300",
          message: null,
          icon: null,
        };
    }
  };

  const validationDisplay = getConsumerValidationDisplay();

  return (
    <div className="bg-blue-50 p-6 rounded-lg">
      <h2 className="text-xl font-semibold mb-4">Créer un Package</h2>

      {(error || writeError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">
            {error || writeError?.message || "Une erreur est survenue"}
          </p>
        </div>
      )}

      <form onSubmit={handleCreatePackage} className="space-y-4">
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
            Identifiant unique du package
          </p>
        </div>

        <div>
          <label
            htmlFor="intendedConsumer"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Adresse du consumer assigné
          </label>
          <div className="relative">
            <input
              type="text"
              id="intendedConsumer"
              value={intendedConsumer}
              onChange={(e) => setIntendedConsumer(e.target.value)}
              disabled={isLoading}
              className={`
                w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                ${
                  isLoading
                    ? "bg-gray-100 cursor-not-allowed"
                    : validationDisplay.style
                }
              `}
              placeholder="0x..."
            />
            {/* Icône de validation dans le champ */}
            {validationDisplay.icon && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-lg">{validationDisplay.icon}</span>
              </div>
            )}
            {/* Spinner de chargement */}
            {isValidatingConsumer && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              </div>
            )}
          </div>

          {/* Message de validation */}
          {validationDisplay.message && (
            <p
              className={`text-xs mt-1 font-medium ${
                consumerValidationStatus === "valid"
                  ? "text-green-600"
                  : consumerValidationStatus === "not_registered"
                  ? "text-orange-600"
                  : "text-red-600"
              }`}
            >
              {validationDisplay.message}
            </p>
          )}

          <p className="text-xs text-gray-500 mt-1">
            Adresse Ethereum du consumer qui recevra ce package
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || consumerValidationStatus !== "valid"}
          className={`
            w-full py-3 px-4 rounded-lg font-semibold text-white transition-all
            ${
              isLoading || consumerValidationStatus !== "valid"
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
              ⏳ Attente de confirmation sur la blockchain...
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

      <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p>
          <strong>💡 Comment ça marche :</strong>
        </p>
        <p>1. Créez un package avec un nombre de bouteilles</p>
        <p>2. Assignez un consumer qui pourra le recevoir</p>
        <p>
          3. Le consumer pourra scanner le QR code pour récupérer le package
        </p>
        <p className="mt-2 text-blue-600">
          <strong>
            🔍 L'adresse consumer est validée automatiquement en temps réel
          </strong>
        </p>
      </div>
    </div>
  );
}
