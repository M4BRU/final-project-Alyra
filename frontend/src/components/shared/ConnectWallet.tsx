"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function ConnectWallet() {
  return (
    <Card className="max-w-md mx-auto mt-10 text-center">
      <CardHeader>
        <CardTitle className="flex justify-center items-center gap-2 text-yellow-600">
          <AlertTriangle className="w-6 h-6" />
          Connexion requise
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-700">
          Veuillez connecter votre wallet pour accéder à l'application.
        </p>
      </CardContent>
    </Card>
  );
}
