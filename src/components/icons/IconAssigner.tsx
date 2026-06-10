'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { PixelPreview } from './PixelPreview'
import { IconGallery } from './IconGallery'
import { Button } from '@/components/ui/button'

interface Props {
  sourceType: 'track' | 'playlist' | 'scenario'
  sourceId: string
  currentIconKey?: string
  title?: string // pour la suggestion auto
}

export function IconAssigner({ sourceType, sourceId, currentIconKey, title }: Props) {
  const [iconKey, setIconKey] = useState<string | undefined>(currentIconKey)
  const [showGallery, setShowGallery] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [suggesting, setSuggesting] = useState(false)

  async function handleAssign(key: string): Promise<void> {
    setAssigning(true)
    try {
      const res = await fetch('/api/icons/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceType, sourceId, iconKey: key, mode: 'manual' }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(typeof data.error === 'string' ? data.error : 'Erreur assignation')
      }

      setIconKey(key)
      setShowGallery(false)
      toast.success('Icône assignée')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setAssigning(false)
    }
  }

  async function handleSuggest(): Promise<void> {
    if (!title) {
      toast.error('Aucun titre disponible pour la suggestion')
      return
    }

    setSuggesting(true)
    try {
      const res = await fetch(`/api/icons/suggest?title=${encodeURIComponent(title)}`)
      if (!res.ok) throw new Error('Erreur suggestion')

      const data = (await res.json()) as { icon: { key: string; name?: string } | null }

      if (!data.icon) {
        toast('Aucune suggestion trouvée')
        return
      }

      await handleAssign(data.icon.key)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setSuggesting(false)
    }
  }

  const [tab, setTab] = useState<'gallery' | 'emoji'>('gallery')
  const [customEmoji, setCustomEmoji] = useState('')

  function handleCustomEmoji() {
    const emoji = customEmoji.trim()
    if (!emoji) return
    void handleAssign(emoji)
    setCustomEmoji('')
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {iconKey ? (
          <PixelPreview iconKey={iconKey} size={48} />
        ) : (
          <div className="w-12 h-12 rounded border border-dashed border-muted-foreground/40 flex items-center justify-center text-muted-foreground text-xs">
            —
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowGallery((v) => !v)}
            disabled={assigning}
          >
            {showGallery ? 'Fermer' : iconKey ? 'Changer' : 'Choisir'}
          </Button>
          {title && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void handleSuggest()}
              disabled={suggesting || assigning}
            >
              {suggesting ? 'Suggestion...' : 'Auto'}
            </Button>
          )}
        </div>
      </div>

      {showGallery && (
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex gap-1 text-xs">
            <button
              onClick={() => setTab('gallery')}
              className={`px-3 py-1 rounded ${tab === 'gallery' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              Bibliothèque
            </button>
            <button
              onClick={() => setTab('emoji')}
              className={`px-3 py-1 rounded ${tab === 'emoji' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              Emoji custom
            </button>
          </div>

          {tab === 'gallery' ? (
            <IconGallery
              selectedKey={iconKey}
              onSelect={(key) => void handleAssign(key)}
            />
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Tape ou colle n&apos;importe quel emoji</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  placeholder="🎵 🌙 🦁 🚀 …"
                  className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-2xl focus:outline-none focus:ring-1 focus:ring-ring"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCustomEmoji() }}
                />
                <Button size="sm" onClick={handleCustomEmoji} disabled={!customEmoji.trim() || assigning}>
                  Utiliser
                </Button>
              </div>
              {customEmoji.trim() && (
                <div className="flex items-center gap-2 mt-1">
                  <PixelPreview iconKey={customEmoji.trim()} size={40} />
                  <span className="text-xs text-muted-foreground">Aperçu</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
