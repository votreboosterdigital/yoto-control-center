'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlayerControls } from './PlayerControls'
import type { Device } from '@/lib/yoto/types'

interface DeviceCardProps {
  device: Device
}

export function DeviceCard({ device }: DeviceCardProps) {
  const isPlaying = device.currentPlayback?.status === 'playing'
  const isPaused = device.currentPlayback?.status === 'paused'
  const cardId = device.currentPlayback?.contentId
  const [copied, setCopied] = useState(false)

  let playbackLabel: string | null = null
  if (isPlaying && device.currentPlayback?.trackTitle) {
    playbackLabel = device.currentPlayback.trackTitle
  } else if (isPlaying) {
    playbackLabel = 'En lecture'
  } else if (isPaused) {
    playbackLabel = 'En pause'
  }

  const playbackStatus = device.currentPlayback?.status ?? (device.online ? 'idle' : 'offline')

  function handleCopy() {
    if (!cardId) return
    void navigator.clipboard.writeText(cardId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
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

        {cardId && (
          <div className="flex items-center gap-2 pt-1">
            <p className="text-xs text-muted-foreground">
              Carte : <code className="font-mono text-foreground bg-muted px-1 py-0.5 rounded">{cardId}</code>
            </p>
            <button
              onClick={handleCopy}
              className="text-xs text-primary hover:underline shrink-0"
              title="Copier l'ID de carte"
            >
              {copied ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        )}

        <PlayerControls
          deviceId={device.id}
          currentStatus={playbackStatus}
          currentVolume={device.volume}
        />
      </CardContent>
    </Card>
  )
}
