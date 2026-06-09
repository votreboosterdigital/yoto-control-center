import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Device } from '@/lib/yoto/types'

interface DeviceCardProps {
  device: Device
}

export function DeviceCard({ device }: DeviceCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{device.name}</CardTitle>
          <Badge variant={device.online ? 'default' : 'secondary'}>
            {device.online ? 'En ligne' : 'Hors ligne'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Type : {device.type}</p>
        <p className="text-sm text-muted-foreground">Volume : {device.volume}%</p>
      </CardContent>
    </Card>
  )
}
