"use client";

import { useAccount } from "wagmi";
import { useReadContract } from "wagmi";
import { chainsToBout, boutTrackerAbi } from "@/constants";
import { useChainId } from "wagmi";
import BoutStats from "@/components/shared/BoutStats";
import { useState, useEffect, useCallback } from "react";
import { readContract } from "@wagmi/core";
import { useConfig } from "wagmi";
import { Address } from "viem";

export default function StatsPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const boutTrackerAddress = chainsToBout[chainId]?.tracker;

  const [userRole, setUserRole] = useState<"SUPPLIER" | "CONSUMER" | null>(
    null
  );
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);

  // Vérifier le rôle utilisateur
  const checkUserRegistration = useCallback(async () => {
    if (!boutTrackerAddress || !address) {
      setLoading(false);
      return;
    }

    try {
      const isUserRegistered = await readContract(config, {
        address: boutTrackerAddress as Address,
        abi: boutTrackerAbi,
        functionName: "isRegistered",
        args: [address],
      });

      if (isUserRegistered) {
        const role = await readContract(config, {
          address: boutTrackerAddress as Address,
          abi: boutTrackerAbi,
          functionName: "getUserRole",
          args: [address],
        });

        setIsRegistered(true);
        setUserRole(role === 1 ? "SUPPLIER" : "CONSUMER");
      } else {
        setIsRegistered(false);
        setUserRole(null);
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du rôle:", error);
      setIsRegistered(false);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  }, [boutTrackerAddress, address, config]);

  useEffect(() => {
    checkUserRegistration();
  }, [checkUserRegistration]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500 mx-auto mb-4"></div>
          <div className="text-gray-500">Chargement des statistiques...</div>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Connectez votre wallet
          </h1>
          <p className="text-gray-600">
            Connectez votre wallet pour voir les statistiques du système BOUT
          </p>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-4xl mb-4">📊</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Inscription requise
          </h1>
          <p className="text-gray-600 mb-4">
            Vous devez vous inscrire dans le système BOUT pour accéder aux
            statistiques personnelles.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header de la page */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              📊 Statistiques BOUT
            </h1>
            <p className="text-gray-600 mt-1">
              Tableau de bord complet des performances et de l'impact
              environnemental
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Connecté en tant que</div>
              <div
                className={`font-semibold px-3 py-1 rounded-full text-sm ${
                  userRole === "SUPPLIER"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {userRole}
              </div>
            </div>
            <a
              href="/"
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors text-sm"
            >
              ← Retour
            </a>
          </div>
        </div>
      </div>

      {/* Composant BoutStats */}
      <BoutStats userRole={userRole} onRefresh={checkUserRegistration} />
    </div>
  );
}
