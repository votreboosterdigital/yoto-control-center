import { getProvider } from '@/lib/yoto'
import { DeviceCard } from '@/components/devices/DeviceCard'
import { logger } from '@/lib/logger'
import type { Device } from '@/lib/yoto/types'

async function fetchDevices(): Promise<{ devices: Device[]; error: string | null }> {
  try {
    const provider = getProvider()
    const devices = await provider.listDevices()
    return { devices, error: null }
  } catch (error) {
    logger.error({ error }, 'Failed to fetch devices for page')
    return { devices: [], error: 'Impossible de charger les appareils. Vérifie la configuration.' }
  }
}

export default async function DevicesPage() {
  const { devices, error } = await fetchDevices()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Appareils</h2>

      {error ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <p className="text-destructive font-medium">{error}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Activez le mode mock via{' '}
            <code className="text-xs bg-muted px-1 rounded">ENABLE_MOCK_PROVIDER=true</code> ou
            vérifiez vos variables d&apos;environnement.
          </p>
        </div>
      ) : devices.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Aucun appareil Yoto trouvé.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vérifiez votre connexion ou activez le mode mock via{' '}
            <code className="text-xs bg-muted px-1 rounded">ENABLE_MOCK_PROVIDER=true</code>.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}
    </div>
  )
}
