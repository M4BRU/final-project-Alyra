"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import ConnectWallet from "@/components/shared/ConnectWallet";
import BoutForm from "@/components/shared/BoutSystem"; // Ton composant
import { useAccount } from "wagmi";

export default function Home() {
  const { isConnected } = useAccount();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Affichage de loading pendant l'hydratation
  if (!hasMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Chargement de BOUT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🌱 BOUT System
          </h1>
          <p className="text-gray-600">
            Système décentralisé de réutilisation d'emballages
          </p>
        </header>

        {!isConnected ? (
          <div className="max-w-md mx-auto">
            <ConnectWallet />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <BoutForm />
          </div>
        )}
      </div>
    </div>
  );
}
