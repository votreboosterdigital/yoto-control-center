import { YotoClient, DEFAULT_CLIENT_ID } from 'yoto-nodejs-client'

interface DeviceStatus {
  activeCard: string | null
  batteryLevelPercentage: number
  systemVolumePercentage: number
  userVolumePercentage: number
  isOnline: boolean
  isCharging: boolean
  cardInsertionState: number
  networkSsid: string
  temperatureCelcius: string
  uptime: number
  updatedAt: string
}

async function getStatuses(): Promise<Array<{ id: string; name: string; status: DeviceStatus | null }>> {
  const isMock = process.env.ENABLE_MOCK_PROVIDER === 'true'
  if (isMock) {
    return [
      { id: 'mock-player-1', name: 'Yoto de Sofia (simulation)', status: null },
      { id: 'mock-mini-1', name: 'Yoto Mini Chambre (simulation)', status: null },
    ]
  }

  try {
    const client = new YotoClient({
      clientId: process.env.YOTO_CLIENT_ID ?? DEFAULT_CLIENT_ID,
      refreshToken: process.env.YOTO_REFRESH_TOKEN ?? '',
      accessToken: process.env.YOTO_ACCESS_TOKEN ?? '',
      onTokenRefresh: () => {},
    })

    const { devices } = await client.getDevices()
    const results: Array<{ id: string; name: string; status: DeviceStatus | null }> = []

    for (const d of devices) {
      try {
        const status = await client.getDeviceStatus({ deviceId: d.deviceId })
        results.push({ id: d.deviceId, name: d.name, status: status as DeviceStatus })
      } catch {
        results.push({ id: d.deviceId, name: d.name, status: null })
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
  const devices = await getStatuses()
  const isMock = process.env.ENABLE_MOCK_PROVIDER === 'true'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Statut & Cartes</h2>
        <span className="text-sm text-muted-foreground">
          Actualise la page pour rafraîchir
        </span>
      </div>

      {isMock && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Mode simulation actif — les statuts réels ne sont pas disponibles.
            Configure <code className="bg-blue-100 px-1 rounded">ENABLE_MOCK_PROVIDER=false</code> dans <code className="bg-blue-100 px-1 rounded">.env.local</code> pour voir les données réelles.
          </p>
        </div>
      )}

      {devices.length === 0 && (
        <p className="text-muted-foreground">Aucun device trouvé ou tokens expirés.</p>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {devices.map(({ id, name, status }) => (
          <div key={id} className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{name}</h3>
              {status && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {status.isOnline ? 'En ligne' : 'Hors ligne'}
                </span>
              )}
            </div>

            {status ? (
              <div className="space-y-3">
                <div className="rounded-md bg-muted p-3 space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Carte active — ID à copier dans les scénarios
                  </p>
                  {status.activeCard ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-mono bg-background border rounded px-2 py-1">
                        {status.activeCard}
                      </code>
                      <span className="text-xs text-muted-foreground">
                        {status.cardInsertionState === 1 ? '📀 Carte insérée' : '—'}
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Aucune carte active</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Batterie</p>
                    <p className="font-medium">{status.batteryLevelPercentage}% {status.isCharging ? '⚡' : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Volume</p>
                    <p className="font-medium">{status.systemVolumePercentage ?? status.userVolumePercentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">WiFi</p>
                    <p className="font-medium truncate">{status.networkSsid || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Temp.</p>
                    <p className="font-medium">{status.temperatureCelcius}°C</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                    <p className="font-medium">{formatUptime(status.uptime)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MAJ</p>
                    <p className="font-medium">{new Date(status.updatedAt).toLocaleTimeString('fr-CA')}</p>
                  </div>
                </div>

                <div className="rounded-md bg-muted p-2">
                  <p className="text-xs text-muted-foreground font-mono">{id}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {isMock ? 'Données simulées — aucun statut réel disponible.' : 'Statut indisponible.'}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
        <h4 className="font-semibold text-amber-900">Utiliser un ID de carte dans un scénario</h4>
        <div className="text-sm text-amber-800 space-y-1">
          <p>• Insère une carte physique dans la Yoto → actualise cette page → copie l&apos;ID affiché</p>
          <p>• Dans un scénario : step <code className="bg-amber-100 px-1 rounded">play_playlist</code> avec cet ID → la Yoto joue cette carte</p>
          <p>• <code className="bg-amber-100 px-1 rounded">set_volume</code>, <code className="bg-amber-100 px-1 rounded">pause</code>, <code className="bg-amber-100 px-1 rounded">resume</code> fonctionnent sans ID de carte</p>
        </div>
      </div>
    </div>
  )
}
