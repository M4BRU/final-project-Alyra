import type { BoutEvent } from "./BoutSystem";

interface BoutEventProps {
  events: BoutEvent[];
  loading?: boolean;
  onRefresh?: () => void;
  eventRange?: number;
  onRangeChange?: (range: number) => void;
}

export default function BoutEvent({
  events,
  loading = false,
  onRefresh,
  eventRange = 300,
  onRangeChange,
}: BoutEventProps) {
  const getBadgeColor = (type: BoutEvent["type"]) => {
    switch (type) {
      case "SupplierRegistered":
        return "bg-blue-500";
      case "ConsumerRegistered":
        return "bg-green-500";
      case "PackageCreated":
        return "bg-purple-500";
      case "PackageReceived":
        return "bg-orange-500";
      case "BottlesReturnedPending":
        return "bg-yellow-500";
      case "RewardsAllocated":
        return "bg-indigo-500";
      case "RewardsWithdrawn":
        return "bg-emerald-500";
      default:
        return "bg-gray-500";
    }
  };

  const getEventIcon = (type: BoutEvent["type"]) => {
    switch (type) {
      case "SupplierRegistered":
        return "🏭";
      case "ConsumerRegistered":
        return "👤";
      case "PackageCreated":
        return "📦";
      case "PackageReceived":
        return "📥";
      case "BottlesReturnedPending":
        return "♻️";
      case "RewardsAllocated":
        return "💰";
      case "RewardsWithdrawn":
        return "🏦";
      default:
        return "📋";
    }
  };

  const formatAddress = (address?: string) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTransactionHash = (hash?: string) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const getTimeEstimate = (blocks: number) => {
    const minutes = Math.round((blocks * 12) / 60);
    if (minutes < 60) return `~${minutes}min`;
    const hours = Math.round(minutes / 60);
    return `~${hours}h`;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📈 Activité Récente</h2>
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
        </div>
        <div className="text-center p-8">
          <div className="text-gray-500">Chargement des événements...</div>
        </div>
      </div>
    );
  }

  if (!events.length) {
    return (
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">📈 Activité Récente</h2>
          <div className="flex items-center space-x-2">
            {onRangeChange && (
              <select
                value={eventRange}
                onChange={(e) => onRangeChange(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
              >
                <option value={100}>100 blocs ({getTimeEstimate(100)})</option>
                <option value={200}>200 blocs ({getTimeEstimate(200)})</option>
                <option value={300}>300 blocs ({getTimeEstimate(300)})</option>
                <option value={400}>400 blocs ({getTimeEstimate(400)})</option>
              </select>
            )}

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
              >
                🔄 Actualiser
              </button>
            )}
          </div>
        </div>

        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-2">📭</div>
          <div className="text-gray-600 font-medium">Aucun événement</div>
          <div className="text-sm text-gray-500 mt-1">
            Les activités apparaîtront ici au fur et à mesure
          </div>
          <div className="text-xs text-gray-400 mt-2">
            Recherche dans les {eventRange} derniers blocs (
            {getTimeEstimate(eventRange)})
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">📈 Activité Récente</h2>
        <div className="flex items-center space-x-3">
          {onRangeChange && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Plage:</span>
              <select
                value={eventRange}
                onChange={(e) => onRangeChange(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white hover:border-blue-400 focus:border-blue-500 focus:outline-none"
              >
                <option value={100}>100 blocs ({getTimeEstimate(100)})</option>
                <option value={200}>200 blocs ({getTimeEstimate(200)})</option>
                <option value={300}>300 blocs ({getTimeEstimate(300)})</option>
                <option value={400}>400 blocs ({getTimeEstimate(400)})</option>
              </select>
            </div>
          )}

          <span className="text-sm text-gray-500">
            {events.length} événement{events.length > 1 ? "s" : ""}
          </span>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "🔄 Chargement..." : "🔄 Actualiser"}
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-700">
          📊 Affichage des événements des {eventRange} derniers blocs (
          {getTimeEstimate(eventRange)})
          {events.length > 0 && (
            <span className="ml-2">
              • Plus récent: bloc #
              {Math.max(...events.map((e) => e.blockNumber))}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {events.map((event, index) => (
          <div
            key={`${event.transactionHash}-${index}`}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{getEventIcon(event.type)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getBadgeColor(
                      event.type
                    )}`}
                  >
                    {event.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    Bloc #{event.blockNumber}
                  </span>
                </div>

                <div className="text-sm text-gray-700">
                  {event.type === "SupplierRegistered" && (
                    <p>
                      🏭 <strong>Nouveau supplier enregistré:</strong>{" "}
                      <code className="bg-blue-100 px-1 rounded text-blue-800">
                        {formatAddress(event.userAddress)}
                      </code>
                    </p>
                  )}

                  {event.type === "ConsumerRegistered" && (
                    <p>
                      👤 <strong>Nouveau consumer enregistré:</strong>{" "}
                      <code className="bg-green-100 px-1 rounded text-green-800">
                        {formatAddress(event.userAddress)}
                      </code>
                    </p>
                  )}

                  {event.type === "PackageCreated" && (
                    <div>
                      <p>
                        📦 <strong>Package créé #{event.packageId}</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Supplier: {formatAddress(event.supplier)} •{" "}
                        {event.bottleCount} bouteilles
                      </p>
                    </div>
                  )}

                  {event.type === "PackageReceived" && (
                    <div>
                      <p>
                        📥 <strong>Package reçu #{event.packageId}</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Consumer: {formatAddress(event.consumer)} • Supplier:{" "}
                        {formatAddress(event.supplier)}
                      </p>
                    </div>
                  )}

                  {event.type === "BottlesReturnedPending" && (
                    <div>
                      <p>
                        ♻️{" "}
                        <strong>
                          Bouteilles retournées #{event.packageId}
                        </strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Consumer: {formatAddress(event.consumer)} • Récompense
                        en attente: {event.amount?.toFixed(2)} BOUT
                      </p>
                    </div>
                  )}

                  {event.type === "RewardsAllocated" && (
                    <div>
                      <p>
                        💰{" "}
                        <strong>Récompenses allouées #{event.packageId}</strong>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Consumer: {formatAddress(event.consumer)} • Montant:{" "}
                        {event.amount?.toFixed(2)} BOUT
                      </p>
                    </div>
                  )}

                  {event.type === "RewardsWithdrawn" && (
                    <p>
                      🏦 <strong>Retrait effectué:</strong>{" "}
                      <span className="font-medium text-green-600">
                        {event.amount?.toFixed(2)} BOUT
                      </span>
                      <br />
                      <span className="text-xs text-gray-600">
                        Par: {formatAddress(event.userAddress)}
                      </span>
                    </p>
                  )}
                </div>

                {event.transactionHash && (
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="font-medium">TX:</span>{" "}
                    <code className="bg-gray-200 px-1 rounded">
                      {formatTransactionHash(event.transactionHash)}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length > 10 && (
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Affichage des {Math.min(events.length, 50)} événements les plus
            récents dans la plage sélectionnée
          </div>
        </div>
      )}
    </div>
  );
}
