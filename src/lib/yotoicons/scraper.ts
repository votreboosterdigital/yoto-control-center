import * as cheerio from 'cheerio'
import path from 'path'
import fs from 'fs/promises'

const BASE_URL = 'https://yotoicons.com'
const UA = 'Mozilla/5.0 (compatible; YotoControlCenter/1.0; +https://github.com/yoto)'

const MAX_CONCURRENT = 5
const DELAY_MS = 100

export interface YotoIconMeta {
  id: string
  previewUrl: string
}

export interface DownloadResult {
  id: string
  ok: boolean
  localPath?: string
  error?: string
}

export async function scrapeIconsByTag(tag: string): Promise<YotoIconMeta[]> {
  const url = `${BASE_URL}/icons?tag=${encodeURIComponent(tag)}&sort=popular&type=singles`

  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'text/html' },
    signal: AbortSignal.timeout(12_000),
  })

  if (!res.ok) {
    throw new Error(`yotoicons.com a répondu HTTP ${res.status}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  const seen = new Set<string>()
  const icons: YotoIconMeta[] = []

  // Les icônes sont dans <div class="icon" onclick="populate_icon_modal('ID', ...)">
  // avec une <img src="/static/uploads/ID.png"> à l'intérieur
  $('img[src^="/static/uploads/"]').each((_, el) => {
    const src = $(el).attr('src') ?? ''
    const match = /\/static\/uploads\/(\d+)\.png$/i.exec(src)
    if (match?.[1] && !seen.has(match[1])) {
      seen.add(match[1])
      icons.push({ id: match[1], previewUrl: `${BASE_URL}/static/uploads/${match[1]}.png` })
    }
  })

  return icons
}

export async function downloadIcons(
  icons: YotoIconMeta[],
  destDir: string,
  onProgress?: (done: number, total: number) => void,
): Promise<DownloadResult[]> {
  await fs.mkdir(destDir, { recursive: true })

  const results: DownloadResult[] = []
  let cursor = 0
  let done = 0

  async function worker(): Promise<void> {
    while (cursor < icons.length) {
      const icon = icons[cursor++]
      if (!icon) continue
      const result = await downloadOne(icon, destDir)
      results.push(result)
      done++
      onProgress?.(done, icons.length)
      // Délai entre requêtes pour ne pas flooder le serveur
      if (cursor < icons.length) await sleep(DELAY_MS)
    }
  }

  const workers = Array.from({ length: Math.min(MAX_CONCURRENT, icons.length) }, worker)
  await Promise.all(workers)

  return results
}

async function downloadOne(icon: YotoIconMeta, destDir: string): Promise<DownloadResult> {
  const localPath = path.join(destDir, `${icon.id}.png`)

  try {
    // Déjà téléchargé — skip
    try {
      await fs.access(localPath)
      return { id: icon.id, ok: true, localPath }
    } catch {
      // Absent, continuer
    }

    const res = await fetch(icon.previewUrl, {
      headers: { 'User-Agent': UA, Referer: BASE_URL },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const buf = await res.arrayBuffer()
    await fs.writeFile(localPath, Buffer.from(buf))

    return { id: icon.id, ok: true, localPath }
  } catch (err) {
    return { id: icon.id, ok: false, error: err instanceof Error ? err.message : 'Erreur' }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
