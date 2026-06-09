import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Device } from '@/lib/yoto/types'

interface DeviceCardProps {
  device: Device
}

export function DeviceCard({ device }: DeviceCardProps) {
  const isPlaying = device.currentPlayback?.status === 'playing'
  const isPaused = device.currentPlayback?.status === 'paused'

  let playbackLabel: string | null = null
  if (isPlaying && device.currentPlayback?.trackTitle) {
    playbackLabel = device.currentPlayback.trackTitle
  } else if (isPlaying) {
    playbackLabel = 'En lecture'
  } else if (isPaused) {
    playbackLabel = 'En pause'
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{device.name}</CardTitle>
          <Badge variant={device.online ? 'default' : 'secondary'}>
            {device.online ? 'En ligne' : 'Hors ligne'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground capitalize">
          Yoto {device.type === 'mini' ? 'Mini' : 'Player'}
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Volume : <span className="font-medium text-foreground">{device.volume}%</span>
        </p>
        {device.batteryLevel !== undefined && (
          <p className="text-sm text-muted-foreground">
            Batterie : <span className="font-medium text-foreground">{device.batteryLevel}%</span>
          </p>
        )}
        {playbackLabel && (
          <p className="text-sm text-muted-foreground truncate" title={playbackLabel}>
            {isPlaying ? '▶' : '⏸'}{' '}
            <span className="font-medium text-foreground">{playbackLabel}</span>
          </p>
        )}
        {!playbackLabel && device.online && (
          <p className="text-sm text-muted-foreground">Inactif</p>
        )}
      </CardContent>
    </Card>
  )
}
