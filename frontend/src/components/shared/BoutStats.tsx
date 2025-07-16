"use client";

import { useState, useEffect } from "react";
import { useReadContract, useConfig } from "wagmi";
import { chainsToBout, boutTrackerAbi } from "@/constants";
import { useChainId, useAccount } from "wagmi";
import { readContract } from "@wagmi/core";
import { Address } from "viem";

// Types pour les statistiques
type SupplierStats = {
  totalPackageSent: number;
  totalBottlesSent: number;
  totalBottlesReturned: number;
  totalRewardsEarned: number;
};

type ConsumerStats = {
  totalPackagesReceived: number;
  totalBottlesReceived: number;
  totalBottlesReturned: number;
  totalRewardsEarned: number;
};

type GlobalStats = {
  totalPackages: number;
  totalBottlesCirculation: number;
  totalBottlesReturned: number;
  totalRewards: number;
  globalReturnRate: number;
};

interface BoutStatsProps {
  userRole?: "SUPPLIER" | "CONSUMER" | null;
  onRefresh?: () => void;
}

export default function BoutStats({ userRole, onRefresh }: BoutStatsProps) {
  const chainId = useChainId();
  const config = useConfig();
  const { address } = useAccount();
  const boutTrackerAddress = chainsToBout[chainId]?.tracker;

  // ✅ DEBUG LOGS
  console.log("=== BoutStats Debug ===");
  console.log("userRole:", userRole);
  console.log("address:", address);
  console.log("boutTrackerAddress:", boutTrackerAddress);
  console.log("========================");

  const [supplierStats, setSupplierStats] = useState<SupplierStats | null>(
    null
  );
  const [consumerStats, setConsumerStats] = useState<ConsumerStats | null>(
    null
  );
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Récupérer les statistiques globales
  const { data: rawGlobalStats, refetch: refetchGlobalStats } = useReadContract(
    {
      address: boutTrackerAddress as `0x${string}`,
      abi: boutTrackerAbi,
      functionName: "getGlobalStats",
      query: {
        enabled: !!boutTrackerAddress,
      },
    }
  );

  // Récupérer les statistiques personnelles
  const fetchPersonalStats = async () => {
    if (!boutTrackerAddress || !address || !userRole) return;

    try {
      if (userRole === "SUPPLIER") {
        const stats = (await readContract(config, {
          address: boutTrackerAddress as Address,
          abi: boutTrackerAbi,
          functionName: "getSupplierStats",
          args: [address],
        })) as any;

        setSupplierStats({
          totalPackageSent: Number(stats.totalPackageSent),
          totalBottlesSent: Number(stats.totalBottlesSent),
          totalBottlesReturned: Number(stats.totalBottlesReturned),
          totalRewardsEarned: Number(stats.totalRewardsEarned) / 1e18,
        });
      } else if (userRole === "CONSUMER") {
        const stats = (await readContract(config, {
          address: boutTrackerAddress as Address,
          abi: boutTrackerAbi,
          functionName: "getConsumerStats",
          args: [address],
        })) as any;

        setConsumerStats({
          totalPackagesReceived: Number(stats.totalPackagesReceived),
          totalBottlesReceived: Number(stats.totalBottlesReceived),
          totalBottlesReturned: Number(stats.totalBottlesReturned),
          totalRewardsEarned: Number(stats.totalRewardsEarned) / 1e18,
        });
      }
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des stats personnelles:",
        error
      );
    }
  };

  // Traiter les statistiques globales
  useEffect(() => {
    if (rawGlobalStats) {
      // ✅ Correction TypeScript : destructurer directement le tuple
      const [
        totalPackages,
        totalBottlesCirculation,
        totalBottlesReturned,
        totalRewards,
        globalReturnRate,
      ] = rawGlobalStats;

      setGlobalStats({
        totalPackages: Number(totalPackages),
        totalBottlesCirculation: Number(totalBottlesCirculation),
        totalBottlesReturned: Number(totalBottlesReturned),
        totalRewards: Number(totalRewards) / 1e18,
        globalReturnRate: Number(globalReturnRate),
      });
    }
  }, [rawGlobalStats]);

  // Récupérer les stats personnelles quand nécessaire
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      await fetchPersonalStats();
      setLoading(false);
    };

    if (userRole && address) {
      loadStats();
    }
  }, [userRole, address, boutTrackerAddress]);

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchPersonalStats(), refetchGlobalStats()]);
    setLoading(false);
    onRefresh?.();
  };

  // Calculer les métriques personnelles
  const getPersonalMetrics = () => {
    if (userRole === "SUPPLIER" && supplierStats) {
      const returnRate =
        supplierStats.totalBottlesSent > 0
          ? (supplierStats.totalBottlesReturned /
              supplierStats.totalBottlesSent) *
            100
          : 0;
      const avgBottlesPerPackage =
        supplierStats.totalPackageSent > 0
          ? supplierStats.totalBottlesSent / supplierStats.totalPackageSent
          : 0;

      return { returnRate, avgBottlesPerPackage };
    } else if (userRole === "CONSUMER" && consumerStats) {
      const returnRate =
        consumerStats.totalBottlesReceived > 0
          ? (consumerStats.totalBottlesReturned /
              consumerStats.totalBottlesReceived) *
            100
          : 0;
      const avgBottlesPerPackage =
        consumerStats.totalPackagesReceived > 0
          ? consumerStats.totalBottlesReceived /
            consumerStats.totalPackagesReceived
          : 0;

      return { returnRate, avgBottlesPerPackage };
    }
    return { returnRate: 0, avgBottlesPerPackage: 0 };
  };

  // Calculer l'impact environnemental
  const getEnvironmentalImpact = (bottlesReturned: number) => {
    // Estimations basées sur des données réelles :
    const carbonSavedPerBottle = 0.5; // kg CO2 économisé par bouteille réutilisée
    const energySavedPerBottle = 0.7; // kWh économisé par bouteille
    const waterSavedPerBottle = 0.2; // litres d'eau économisés

    return {
      carbonSaved: bottlesReturned * carbonSavedPerBottle,
      energySaved: bottlesReturned * energySavedPerBottle,
      waterSaved: bottlesReturned * waterSavedPerBottle,
      treesEquivalent: (bottlesReturned * carbonSavedPerBottle) / 22, // 1 arbre absorbe ~22kg CO2/an
    };
  };

  const personalImpact =
    userRole === "SUPPLIER" && supplierStats
      ? getEnvironmentalImpact(supplierStats.totalBottlesReturned)
      : userRole === "CONSUMER" && consumerStats
      ? getEnvironmentalImpact(consumerStats.totalBottlesReturned)
      : null;

  const globalImpact = globalStats
    ? getEnvironmentalImpact(globalStats.totalBottlesReturned)
    : null;

  if (loading && !globalStats) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📊 Statistiques</h2>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
        </div>
        <div className="text-center p-8">
          <div className="text-gray-500">Chargement des statistiques...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques Personnelles */}
      {userRole && (supplierStats || consumerStats) && (
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {userRole === "SUPPLIER"
                ? "🏭 Mes Statistiques Supplier"
                : "👤 Mes Statistiques Consumer"}
            </h2>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
            >
              🔄 Actualiser
            </button>
          </div>

          {userRole === "SUPPLIER" && supplierStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {supplierStats.totalPackageSent}
                </div>
                <div className="text-sm text-blue-700 font-medium">
                  Packages envoyés
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {supplierStats.totalBottlesSent}
                </div>
                <div className="text-sm text-green-700 font-medium">
                  Bouteilles envoyées
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {supplierStats.totalBottlesReturned}
                </div>
                <div className="text-sm text-orange-700 font-medium">
                  Bouteilles récupérées
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {supplierStats.totalRewardsEarned.toFixed(2)}
                </div>
                <div className="text-sm text-purple-700 font-medium">
                  BOUT gagnés
                </div>
              </div>
            </div>
          )}

          {userRole === "CONSUMER" && consumerStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {consumerStats.totalPackagesReceived}
                </div>
                <div className="text-sm text-blue-700 font-medium">
                  Packages reçus
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {consumerStats.totalBottlesReceived}
                </div>
                <div className="text-sm text-green-700 font-medium">
                  Bouteilles reçues
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-600">
                  {consumerStats.totalBottlesReturned}
                </div>
                <div className="text-sm text-orange-700 font-medium">
                  Bouteilles retournées
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-600">
                  {consumerStats.totalRewardsEarned.toFixed(2)}
                </div>
                <div className="text-sm text-purple-700 font-medium">
                  BOUT gagnés
                </div>
              </div>
            </div>
          )}

          {/* Métriques calculées + Impact Environnemental Personnel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">
                Taux de retour personnel:
              </span>
              <span
                className={`font-bold text-lg ${
                  getPersonalMetrics().returnRate >= 80
                    ? "text-green-600"
                    : getPersonalMetrics().returnRate >= 60
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              >
                {getPersonalMetrics().returnRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">
                Moy. bouteilles/package:
              </span>
              <span className="font-bold text-lg text-blue-600">
                {getPersonalMetrics().avgBottlesPerPackage.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Impact Environnemental Personnel */}
          {personalImpact && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                🌱 Votre Impact Environnemental
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {personalImpact.carbonSaved.toFixed(1)}
                  </div>
                  <div className="text-xs text-green-700">
                    kg CO₂ économisés
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {personalImpact.energySaved.toFixed(1)}
                  </div>
                  <div className="text-xs text-blue-700">kWh économisés</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-600">
                    {personalImpact.waterSaved.toFixed(1)}
                  </div>
                  <div className="text-xs text-cyan-700">
                    L d'eau économisés
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {personalImpact.treesEquivalent.toFixed(2)}
                  </div>
                  <div className="text-xs text-emerald-700">
                    équiv. arbres/an
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center text-sm text-green-700 bg-green-100 p-2 rounded">
                🏆 <strong>Crédit Carbone Indicatif:</strong>{" "}
                {personalImpact.carbonSaved.toFixed(1)} kg CO₂
                <span className="ml-2 text-xs">
                  (≈ {(personalImpact.carbonSaved * 25).toFixed(0)}€ de crédit
                  carbone)
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Statistiques Globales */}
      {globalStats && (
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              🌍 Statistiques Globales du Projet
            </h2>
            <div className="text-sm text-gray-500">
              Données de tous les utilisateurs
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {globalStats.totalPackages.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700 font-medium">
                Packages créés
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {globalStats.totalBottlesCirculation.toLocaleString()}
              </div>
              <div className="text-sm text-green-700 font-medium">
                Bouteilles en circulation
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {globalStats.totalBottlesReturned.toLocaleString()}
              </div>
              <div className="text-sm text-orange-700 font-medium">
                Bouteilles retournées
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {globalStats.totalRewards.toLocaleString()}
              </div>
              <div className="text-sm text-purple-700 font-medium">
                BOUT distribués
              </div>
            </div>
          </div>

          {/* Métriques globales avancées */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div
                className={`text-3xl font-bold ${
                  globalStats.globalReturnRate >= 80
                    ? "text-green-600"
                    : globalStats.globalReturnRate >= 60
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              >
                {globalStats.globalReturnRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Taux de retour global
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {globalStats.totalPackages > 0
                  ? (
                      globalStats.totalBottlesCirculation /
                      globalStats.totalPackages
                    ).toFixed(1)
                  : "0"}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Moy. bouteilles/package
              </div>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {globalStats.totalBottlesReturned > 0
                  ? (
                      globalStats.totalRewards /
                      globalStats.totalBottlesReturned
                    ).toFixed(1)
                  : "0"}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                BOUT/bouteille moyenne
              </div>
            </div>
          </div>

          {/* Barre de progression visuelle + Impact Environnemental Global */}
          <div className="mt-6 space-y-4">
            {/* Barre de progression */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Impact environnemental global
                </span>
                <span className="text-sm text-gray-600">
                  {globalStats.totalBottlesReturned.toLocaleString()}/
                  {globalStats.totalBottlesCirculation.toLocaleString()}{" "}
                  bouteilles
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    globalStats.globalReturnRate >= 80
                      ? "bg-green-500"
                      : globalStats.globalReturnRate >= 60
                      ? "bg-orange-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(globalStats.globalReturnRate, 100)}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {globalStats.totalBottlesReturned.toLocaleString()} bouteilles
                sauvées de la pollution 🌱
              </div>
            </div>

            {/* Impact Environnemental Global */}
            {globalImpact && (
              <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <h3 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center">
                  🌍 Impact Environnemental Global du Projet BOUT
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center bg-white p-3 rounded-lg border border-emerald-200">
                    <div className="text-3xl font-bold text-green-600">
                      {globalImpact.carbonSaved.toLocaleString()}
                    </div>
                    <div className="text-sm text-green-700 font-medium">
                      kg CO₂ économisés
                    </div>
                  </div>
                  <div className="text-center bg-white p-3 rounded-lg border border-blue-200">
                    <div className="text-3xl font-bold text-blue-600">
                      {globalImpact.energySaved.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">
                      kWh économisés
                    </div>
                  </div>
                  <div className="text-center bg-white p-3 rounded-lg border border-cyan-200">
                    <div className="text-3xl font-bold text-cyan-600">
                      {globalImpact.waterSaved.toLocaleString()}
                    </div>
                    <div className="text-sm text-cyan-700 font-medium">
                      L d'eau économisés
                    </div>
                  </div>
                  <div className="text-center bg-white p-3 rounded-lg border border-emerald-200">
                    <div className="text-3xl font-bold text-emerald-600">
                      {globalImpact.treesEquivalent.toFixed(0)}
                    </div>
                    <div className="text-sm text-emerald-700 font-medium">
                      équiv. arbres/an
                    </div>
                  </div>
                </div>

                {/* Crédit Carbone Global */}
                <div className="text-center p-4 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
                  <div className="text-2xl font-bold text-green-800 mb-1">
                    💳 Crédit Carbone Global:{" "}
                    {globalImpact.carbonSaved.toLocaleString()} kg CO₂
                  </div>
                  <div className="text-lg text-green-700">
                    Valeur estimée:{" "}
                    <span className="font-bold">
                      {(globalImpact.carbonSaved * 25).toLocaleString()}€
                    </span>
                  </div>
                  <div className="text-xs text-green-600 mt-2">
                    Base: 25€/tonne CO₂ (prix moyen crédit carbone EU ETS 2024)
                  </div>
                </div>

                {/* Comparaisons parlantes */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <div className="text-lg font-bold text-blue-700">
                      {Math.round(globalImpact.carbonSaved / 2300)} 🚗
                    </div>
                    <div className="text-xs text-blue-600">
                      voitures essence retirées de la route pendant 1 an
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="text-lg font-bold text-green-700">
                      {Math.round(globalImpact.energySaved / 3500)} 🏠
                    </div>
                    <div className="text-xs text-green-600">
                      foyers alimentés pendant 1 mois
                    </div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded border border-purple-200">
                    <div className="text-lg font-bold text-purple-700">
                      {Math.round(globalImpact.waterSaved / 150)} 👥
                    </div>
                    <div className="text-xs text-purple-600">
                      personnes hydratées pendant 1 jour
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Message si pas de stats personnelles */}
      {userRole && !supplierStats && !consumerStats && !loading && (
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <div className="text-4xl mb-2">📊</div>
            <div className="text-gray-600 font-medium">
              Pas encore de statistiques
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {userRole === "SUPPLIER"
                ? "Créez votre premier package pour voir vos stats"
                : "Recevez et retournez des packages pour voir vos stats"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
