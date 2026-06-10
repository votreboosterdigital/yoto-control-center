import { getProvider } from '@/lib/yoto'

interface DeviceStatus {
  activeCard: string | null
  batteryLevelPercentage: number
  systemVolumePercentage: number
  isOnline: boolean
  isCharging: boolean
  cardInsertionState: number
  networkSsid: string
  temperatureCelcius: string
  uptime: number
  updatedAt: string
}

async function getDeviceStatuses() {
  try {
    const provider = getProvider()
    const devices = await provider.listDevices()

    const results: Array<{ id: string; name: string; status: DeviceStatus | null }> = []

    for (const device of devices) {
      try {
        const res = await fetch(
          `http://localhost:${process.env.PORT ?? 3000}/api/devices/${device.id}/status`,
          { cache: 'no-store' },
        )
        const data = await res.json() as { status: DeviceStatus | null }
        results.push({ id: device.id, name: device.name, status: data.status })
      } catch {
        results.push({ id: device.id, name: device.name, status: null })
      }
    }

    return results
  } catch {
    return []
  }
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}min`
}

export default async function LibraryPage() {
  const devices = await getDeviceStatuses()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Statut & Cartes</h2>
        <span className="text-sm text-muted-foreground">
          Données temps réel — actualise la page pour rafraîchir
        </span>
      </div>

      {devices.length === 0 && (
        <p className="text-muted-foreground">Aucun device trouvé ou tokens expirés.</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {devices.map(({ id, name, status }) => (
          <div key={id} className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status?.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {status?.isOnline ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>

            {status ? (
              <div className="space-y-3">
                {/* Carte active */}
                <div className="rounded-md bg-muted p-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Carte active (ID à utiliser dans les scénarios)</p>
                  {status.activeCard ? (
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono bg-background border rounded px-2 py-1 flex-1">
                        {status.activeCard}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        {status.cardInsertionState === 1 ? '📀 Carte insérée' : '— Aucune carte'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucune carte active</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Batterie</p>
                    <p className="font-medium">{status.batteryLevelPercentage}% {status.isCharging ? '⚡' : ''}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Volume système</p>
                    <p className="font-medium">{status.systemVolumePercentage}%</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Réseau WiFi</p>
                    <p className="font-medium">{status.networkSsid || '—'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Température</p>
                    <p className="font-medium">{status.temperatureCelcius}°C</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="font-medium">{formatUptime(status.uptime)}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Dernière MAJ</p>
                    <p className="font-medium">{new Date(status.updatedAt).toLocaleTimeString('fr-CA')}</p>
                  </div>
                </div>

                {/* Device ID */}
                <div className="rounded-md bg-muted p-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Device ID</p>
                  <code className="text-xs font-mono text-muted-foreground">{id}</code>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Statut indisponible — token expiré ?</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
        <h4 className="font-semibold text-amber-900">Comment utiliser les IDs de cartes dans les scénarios</h4>
        <div className="text-sm text-amber-800 space-y-1">
          <p>• L&apos;<strong>ID de la carte active</strong> ci-dessus est l&apos;ID réel de la carte physiquement insérée dans le Yoto.</p>
          <p>• Dans un scénario, utilise <code className="bg-amber-100 px-1 rounded">play_playlist</code> avec cet ID pour jouer cette carte.</p>
          <p>• <code className="bg-amber-100 px-1 rounded">set_volume</code>, <code className="bg-amber-100 px-1 rounded">pause</code> et <code className="bg-amber-100 px-1 rounded">resume</code> fonctionnent toujours, sans ID.</p>
          <p>• Change la carte dans le Yoto physique et actualise cette page pour obtenir son ID.</p>
        </div>
      </div>
    </div>
  )
}
