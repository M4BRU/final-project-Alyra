import type { PackageType } from "./BoutSystem";

interface BoutPackageListProps {
  packages: PackageType[];
  loading?: boolean;
  userRole?: "SUPPLIER" | "CONSUMER" | null;
  onRefresh?: () => void;
}

export default function BoutPackageList({
  packages,
  loading = false,
  userRole,
  onRefresh,
}: BoutPackageListProps) {
  const getStatusInfo = (status: number) => {
    switch (status) {
      case 0:
        return {
          label: "Envoyé",
          color: "bg-blue-100 text-blue-800",
          icon: "📤",
        };
      case 1:
        return {
          label: "Reçu",
          color: "bg-green-100 text-green-800",
          icon: "📥",
        };
      case 2:
        return {
          label: "Retourné",
          color: "bg-orange-100 text-orange-800",
          icon: "♻️",
        };
      case 3:
        return {
          label: "Confirmé",
          color: "bg-purple-100 text-purple-800",
          icon: "✅",
        };
      default:
        return {
          label: "Inconnu",
          color: "bg-gray-100 text-gray-800",
          icon: "❓",
        };
    }
  };

  const formatAddress = (address?: string) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp * 1000).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNextAction = (pkg: PackageType, userRole?: string) => {
    if (userRole === "SUPPLIER") {
      switch (pkg.status) {
        case 0:
          return {
            text: "En attente de réception",
            color: "text-blue-600",
            icon: "⏳",
          };
        case 1:
          return {
            text: "En attente de retour",
            color: "text-green-600",
            icon: "⏳",
          };
        case 2:
          return {
            text: "À confirmer",
            color: "text-orange-600",
            icon: "🔔",
            actionable: true,
          };
        case 3:
          return { text: "Archivé", color: "text-purple-600", icon: "📁" };
        default:
          return { text: "Statut inconnu", color: "text-gray-600", icon: "❓" };
      }
    } else if (userRole === "CONSUMER") {
      switch (pkg.status) {
        case 0:
          return {
            text: "À recevoir",
            color: "text-blue-600",
            icon: "🔔",
            actionable: true,
          };
        case 1:
          return {
            text: "À retourner",
            color: "text-green-600",
            icon: "🔔",
            actionable: true,
          };
        case 2:
          return {
            text: "En attente de confirmation",
            color: "text-orange-600",
            icon: "⏳",
          };
        case 3:
          return { text: "Terminé", color: "text-purple-600", icon: "✅" };
        default:
          return { text: "Statut inconnu", color: "text-gray-600", icon: "❓" };
      }
    }
    return { text: "N/A", color: "text-gray-600", icon: "❓" };
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📦 Mes Packages Actifs</h2>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
        </div>
        <div className="text-center p-8">
          <div className="text-gray-500">Chargement des packages...</div>
        </div>
      </div>
    );
  }

  if (!packages.length) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📦 Mes Packages Actifs</h2>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              🔄 Actualiser
            </button>
          )}
        </div>
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-2">
            {userRole === "SUPPLIER" ? "🏭" : "📦"}
          </div>
          <div className="text-gray-600 font-medium">Aucun package actif</div>
          <div className="text-sm text-gray-500 mt-1">
            {userRole === "SUPPLIER"
              ? "Créez votre premier package pour commencer"
              : "Les packages que vous recevez apparaîtront ici"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">📦 Mes Packages Actifs</h2>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">
            {packages.length} package{packages.length > 1 ? "s" : ""}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              🔄 Actualiser
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {packages.map((pkg) => {
          const statusInfo = getStatusInfo(pkg.status);
          const nextAction = getNextAction(pkg, userRole || undefined);

          return (
            <div
              key={pkg.id}
              className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                nextAction.actionable
                  ? "border-orange-200 bg-orange-50 hover:border-orange-300"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{statusInfo.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      Package #{pkg.id}
                    </h3>
                    <div className="text-sm text-gray-500">
                      {pkg.packageLink}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                  >
                    {statusInfo.label}
                  </span>
                  {nextAction.actionable && (
                    <span className="animate-pulse text-orange-500 text-sm">
                      🔔
                    </span>
                  )}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                <div>
                  <div className="text-gray-500 font-medium">Bouteilles</div>
                  <div className="text-gray-800">
                    {pkg.returnedCount !== undefined && pkg.status >= 2
                      ? `${pkg.returnedCount} / ${pkg.bottleCount}`
                      : pkg.bottleCount}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 font-medium">
                    {userRole === "SUPPLIER" ? "Consumer" : "Supplier"}
                  </div>
                  <div className="text-gray-800 font-mono text-xs">
                    {formatAddress(
                      userRole === "SUPPLIER" ? pkg.consumer : pkg.supplier
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 font-medium">Récompense</div>
                  <div className="text-gray-800">
                    {pkg.returnedCount !== undefined && pkg.status >= 2
                      ? `${(pkg.rewardAmount * pkg.returnedCount).toFixed(
                          2
                        )} BOUT`
                      : `${(pkg.rewardAmount * pkg.bottleCount).toFixed(
                          2
                        )} BOUT`}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500 font-medium">Créé le</div>
                  <div className="text-gray-800">
                    {formatDate(pkg.createdAt)}
                  </div>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="mb-3">
                <div className="flex items-center space-x-2 text-xs">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      pkg.status >= 0 ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`flex-1 h-1 ${
                      pkg.status >= 1 ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      pkg.status >= 1 ? "bg-green-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`flex-1 h-1 ${
                      pkg.status >= 2 ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      pkg.status >= 2 ? "bg-orange-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`flex-1 h-1 ${
                      pkg.status >= 3 ? "bg-purple-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      pkg.status >= 3 ? "bg-purple-500" : "bg-gray-300"
                    }`}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Créé</span>
                  <span>Reçu</span>
                  <span>Retourné</span>
                  <span>Confirmé</span>
                </div>
              </div>

              {/* Action Needed */}
              <div
                className={`flex items-center justify-between p-3 rounded-lg ${
                  nextAction.actionable
                    ? "bg-orange-100 border border-orange-200"
                    : "bg-gray-100"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{nextAction.icon}</span>
                  <span className={`font-medium ${nextAction.color}`}>
                    {nextAction.text}
                  </span>
                </div>

                {nextAction.actionable && (
                  <div className="text-xs text-orange-600 font-medium">
                    Action requise ⚡
                  </div>
                )}
              </div>

              {/* Additional Info for returned packages */}
              {pkg.status >= 2 && pkg.returnedCount !== undefined && (
                <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-gray-500">Taux de retour:</span>
                      <span className="ml-2 font-medium text-purple-600">
                        {Math.round(
                          (pkg.returnedCount / pkg.bottleCount) * 100
                        )}
                        %
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Retourné le:</span>
                      <span className="ml-2 font-medium">
                        {formatDate(pkg.returnedAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Récompense due:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {(pkg.rewardAmount * pkg.returnedCount).toFixed(2)} BOUT
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Total packages:</span>
              <span className="ml-2">{packages.length}</span>
            </div>
            <div>
              <span className="font-medium">En cours:</span>
              <span className="ml-2">
                {packages.filter((p) => p.status < 3).length}
              </span>
            </div>
            <div>
              <span className="font-medium">Terminés:</span>
              <span className="ml-2">
                {packages.filter((p) => p.status === 3).length}
              </span>
            </div>
            <div>
              <span className="font-medium">Actions requises:</span>
              <span className="ml-2 text-orange-600 font-semibold">
                {
                  packages.filter((p) => {
                    const action = getNextAction(p, userRole || undefined);
                    return action.actionable;
                  }).length
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
