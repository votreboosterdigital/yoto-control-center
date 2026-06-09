'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface PlaylistLauncherProps {
  deviceId: string
}

type ContentType = 'playlist' | 'stream'

export function PlaylistLauncher({ deviceId }: PlaylistLauncherProps) {
  const [type, setType] = useState<ContentType>('playlist')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLaunch() {
    const trimmed = value.trim()
    if (!trimmed) {
      toast.error(type === 'playlist' ? "L'ID de playlist est requis" : "L'URL du stream est requise")
      return
    }

    setLoading(true)
    try {
      const body =
        type === 'playlist'
          ? { type: 'playlist' as const, id: trimmed }
          : { type: 'stream' as const, url: trimmed }

      const res = await fetch(`/api/devices/${deviceId}/play`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        toast.error(data.error ?? 'Échec du lancement')
        return
      }

      toast.success('Lecture lancée avec succès')
      setValue('')
    } catch {
      toast.error('Erreur réseau lors du lancement')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 items-center">
      <select
        value={type}
        onChange={(e) => setType(e.target.value as ContentType)}
        disabled={loading}
        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="playlist">Playlist</option>
        <option value="stream">Stream</option>
      </select>

      <input
        type="text"
        className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
        placeholder={type === 'playlist' ? 'ID de playlist…' : 'URL du stream…'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') void handleLaunch() }}
        disabled={loading}
      />

      <Button onClick={() => void handleLaunch()} disabled={loading || !value.trim()}>
        {loading ? '…' : 'Lancer'}
      </Button>
    </div>
  )
}
