'use client'

import { useState } from 'react'
import { toast } from 'sonner'
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
  const [previewUri, setPreviewUri] = useState('')
  const [showPreviewInput, setShowPreviewInput] = useState(false)
  const [previewSending, setPreviewSending] = useState(false)

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

  async function handleDisplayPreview() {
    const uri = previewUri.trim()
    if (!uri) return
    setPreviewSending(true)
    try {
      const res = await fetch('/api/devices/display-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: device.id, uri, timeoutSeconds: 10 }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(typeof data.error === 'string' ? data.error : 'Erreur')
      }
      toast.success('Image envoyée sur l\'écran Yoto')
      setPreviewUri('')
      setShowPreviewInput(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setPreviewSending(false)
    }
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

        {/* Afficher une image sur l'écran physique */}
        <div className="pt-1">
          <button
            onClick={() => setShowPreviewInput((v) => !v)}
            className="text-xs text-primary hover:underline"
          >
            {showPreviewInput ? 'Annuler' : '🖼 Afficher sur l\'écran'}
          </button>
          {showPreviewInput && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-muted-foreground">URL d&apos;une image accessible (PNG/GIF, petite résolution)</p>
              <div className="flex gap-1">
                <input
                  type="url"
                  value={previewUri}
                  onChange={(e) => setPreviewUri(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 h-8 text-xs rounded border border-input bg-background px-2 focus:outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => { if (e.key === 'Enter') void handleDisplayPreview() }}
                />
                <button
                  onClick={() => void handleDisplayPreview()}
                  disabled={!previewUri.trim() || previewSending}
                  className="px-2 h-8 text-xs rounded bg-primary text-primary-foreground disabled:opacity-50"
                >
                  {previewSending ? '…' : 'Envoyer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
