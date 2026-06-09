'use client'

import { useState } from 'react'
import { Play, Pause, SkipBack } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { PlaybackState } from '@/lib/yoto/types'

interface PlayerControlsProps {
  deviceId: string
  currentStatus: PlaybackState['status']
  currentVolume: number
}

export function PlayerControls({ deviceId, currentStatus, currentVolume }: PlayerControlsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [volume, setVolume] = useState(currentVolume)

  async function handleAction(action: 'play' | 'pause' | 'resume') {
    setLoading(action)
    try {
      const res = await fetch(`/api/devices/${deviceId}/${action}`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        toast.error(data.error ?? `Échec de l'action ${action}`)
        return
      }
      const labels: Record<string, string> = {
        play: 'Lecture lancée',
        pause: 'Lecture mise en pause',
        resume: 'Lecture reprise',
      }
      toast.success(labels[action])
    } catch {
      toast.error(`Erreur réseau lors de l'action ${action}`)
    } finally {
      setLoading(null)
    }
  }

  async function handleVolume(newVolume: number) {
    const prevVolume = volume
    setVolume(newVolume)
    setLoading('volume')
    try {
      const res = await fetch(`/api/devices/${deviceId}/volume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: newVolume }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setVolume(prevVolume)
        toast.error(data.error ?? 'Échec du changement de volume')
        return
      }
      toast.success(`Volume mis à jour : ${newVolume}%`)
    } catch {
      setVolume(prevVolume)
      toast.error('Erreur changement volume')
    } finally {
      setLoading(null)
    }
  }

  const isOffline = currentStatus === 'offline'

  return (
    <div className="border-t pt-3 mt-2 space-y-3">
      {/* Contrôles lecture */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={isOffline || loading !== null || currentStatus !== 'playing'}
          onClick={() => handleAction('pause')}
          aria-label="Pause"
        >
          <Pause className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={isOffline || loading !== null || currentStatus !== 'paused'}
          onClick={() => handleAction('resume')}
          aria-label="Reprendre"
        >
          <Play className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={isOffline || loading !== null}
          onClick={() => handleAction('play')}
          aria-label="Relancer"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        {loading !== null && (
          <span className="text-xs text-muted-foreground ml-1">…</span>
        )}
      </div>

      {/* Contrôle volume */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={volume <= 0 || loading !== null || isOffline}
          onClick={() => handleVolume(Math.max(0, volume - 10))}
          aria-label="Baisser le volume"
        >
          −
        </Button>
        <span className="text-sm tabular-nums w-10 text-center text-foreground">
          {volume}%
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={volume >= 100 || loading !== null || isOffline}
          onClick={() => handleVolume(Math.min(100, volume + 10))}
          aria-label="Monter le volume"
        >
          +
        </Button>
      </div>
    </div>
  )
}
