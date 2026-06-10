'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface IconMeta {
  id: string
  previewUrl: string
}

interface SearchResponse {
  icons: IconMeta[]
  total: number
  error?: string
}

interface DownloadResponse {
  ok: number
  failed: number
  downloaded: { id: string; path: string }[]
  errors: { id: string; error?: string }[]
  error?: string
}

export function YotoIconsBrowser() {
  const [tag, setTag] = useState('')
  const [icons, setIcons] = useState<IconMeta[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searching, setSearching] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [downloadStats, setDownloadStats] = useState<{ ok: number; failed: number } | null>(null)

  const search = useCallback(async () => {
    const q = tag.trim()
    if (!q) return

    setSearching(true)
    setIcons([])
    setSelected(new Set())
    setDownloadStats(null)

    try {
      const res = await fetch(`/api/yotoicons/search?tag=${encodeURIComponent(q)}`)
      const data = (await res.json()) as SearchResponse

      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Erreur de recherche')
        return
      }

      setIcons(data.icons)
      if (data.icons.length === 0) {
        toast('Aucune icône trouvée pour ce tag')
      } else {
        toast.success(`${data.icons.length} icône${data.icons.length > 1 ? 's' : ''} trouvée${data.icons.length > 1 ? 's' : ''}`)
      }
    } catch {
      toast.error('Impossible de contacter le serveur')
    } finally {
      setSearching(false)
    }
  }, [tag])

  function toggleIcon(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(icons.map((i) => i.id)))
  }

  function selectNone() {
    setSelected(new Set())
  }

  async function download(idsToDownload: string[]) {
    if (idsToDownload.length === 0) {
      toast('Aucune icône à télécharger')
      return
    }

    setDownloading(true)
    setDownloadStats(null)

    try {
      const res = await fetch('/api/yotoicons/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDownload }),
      })
      const data = (await res.json()) as DownloadResponse

      if (!res.ok || data.error) {
        toast.error(data.error ?? 'Erreur de téléchargement')
        return
      }

      setDownloadStats({ ok: data.ok, failed: data.failed })

      if (data.ok > 0 && data.failed === 0) {
        toast.success(`${data.ok} icône${data.ok > 1 ? 's' : ''} téléchargée${data.ok > 1 ? 's' : ''} dans public/yotoicons/`)
      } else if (data.ok > 0) {
        toast(`${data.ok} ok · ${data.failed} échouée${data.failed > 1 ? 's' : ''}`)
      } else {
        toast.error(`Toutes les téléchargements ont échoué (${data.failed})`)
      }
    } catch {
      toast.error('Impossible de contacter le serveur')
    } finally {
      setDownloading(false)
    }
  }

  const selectedIds = Array.from(selected)
  const allSelected = icons.length > 0 && selected.size === icons.length
  const noneSelected = selected.size === 0

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="flex gap-2">
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void search() }}
          placeholder="Tag de recherche (ex: animals, space, food…)"
          className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={searching}
        />
        <button
          onClick={() => void search()}
          disabled={searching || !tag.trim()}
          className="px-4 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {searching ? 'Recherche…' : 'Rechercher'}
        </button>
      </div>

      {/* Contrôles de sélection */}
      {icons.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{icons.length} icône{icons.length > 1 ? 's' : ''}</span>
            <span>·</span>
            <span>{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={allSelected ? selectNone : selectAll}
              className="px-3 h-8 rounded-md border text-xs hover:bg-muted transition-colors"
            >
              {allSelected ? 'Désélectionner tout' : 'Tout sélectionner'}
            </button>
            <button
              onClick={() => void download(noneSelected ? icons.map((i) => i.id) : selectedIds)}
              disabled={downloading}
              className="px-3 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {downloading
                ? 'Téléchargement…'
                : noneSelected
                  ? `Tout télécharger (${icons.length})`
                  : `Télécharger (${selected.size})`}
            </button>
          </div>
        </div>
      )}

      {/* Stats de téléchargement */}
      {downloadStats && (
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 px-4 py-3 text-sm text-green-800 dark:text-green-200">
          Téléchargement terminé : <strong>{downloadStats.ok} ok</strong>
          {downloadStats.failed > 0 && `, ${downloadStats.failed} échoué${downloadStats.failed > 1 ? 's' : ''}`}
          {downloadStats.ok > 0 && <span className="block text-xs opacity-75 mt-0.5">Icônes dans public/yotoicons/ · accessibles via /yotoicons/&#123;id&#125;.png</span>}
        </div>
      )}

      {/* Grille d'icônes */}
      {icons.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
          {icons.map((icon) => (
            <button
              key={icon.id}
              onClick={() => toggleIcon(icon.id)}
              title={`ID : ${icon.id}`}
              className={[
                'relative aspect-square rounded-md border-2 overflow-hidden transition-all hover:scale-105',
                selected.has(icon.id)
                  ? 'border-primary ring-2 ring-primary ring-offset-1'
                  : 'border-transparent hover:border-muted-foreground/30',
              ].join(' ')}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={icon.previewUrl}
                alt={`Icône ${icon.id}`}
                loading="lazy"
                className="w-full h-full object-contain"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.opacity = '0.2'
                }}
              />
              {selected.has(icon.id) && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[9px] flex items-center justify-center font-bold leading-none">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* État vide */}
      {!searching && icons.length === 0 && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground text-sm">
          <p className="text-2xl mb-2">🔍</p>
          <p>Tape un tag pour rechercher des icônes sur yotoicons.com</p>
          <p className="text-xs mt-1 opacity-70">Exemples : animals · space · food · transport · music</p>
        </div>
      )}
    </div>
  )
}
