import { getProvider } from '@/lib/yoto'
import { DeviceCard } from '@/components/devices/DeviceCard'
import type { Device } from '@/lib/yoto/types'

async function fetchDevices(): Promise<Device[]> {
  try {
    const provider = getProvider()
    return await provider.listDevices()
  } catch {
    return []
  }
}

export default async function DevicesPage() {
  const devices = await fetchDevices()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Appareils</h2>

      {devices.length === 0 ? (
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
