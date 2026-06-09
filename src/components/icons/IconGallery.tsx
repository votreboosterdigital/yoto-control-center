'use client'

import { useState, useEffect } from 'react'
import { PixelPreview } from './PixelPreview'

interface IconItem {
  key: string
  name?: string
  category?: string
}

interface Props {
  onSelect: (key: string) => void
  selectedKey?: string
}

export function IconGallery({ onSelect, selectedKey }: Props) {
  const [query, setQuery] = useState('')
  const [icons, setIcons] = useState<IconItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/icons/search?q=${encodeURIComponent(query)}&limit=24`)
        if (res.ok) {
          const data = (await res.json()) as { icons: IconItem[] }
          setIcons(data.icons)
        }
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Chercher une icône..."
        className="w-full border rounded px-3 py-2 text-sm bg-background"
      />
      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement...</p>
      ) : (
        <div className="grid grid-cols-6 gap-2">
          {icons.map((icon) => (
            <button
              key={icon.key}
              onClick={() => onSelect(icon.key)}
              title={icon.name ?? icon.key}
              className={`flex flex-col items-center gap-1 p-2 rounded border transition-colors ${
                selectedKey === icon.key
                  ? 'border-primary bg-primary/10'
                  : 'border-transparent hover:border-muted-foreground/30'
              }`}
            >
              <PixelPreview iconKey={icon.key} size={40} />
              <span className="text-xs truncate w-full text-center">{icon.name ?? icon.key}</span>
            </button>
          ))}
        </div>
      )}
      {!loading && icons.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">Aucune icône trouvée</p>
      )}
    </div>
  )
}
