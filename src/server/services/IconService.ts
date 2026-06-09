import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

interface YotoPublicIcon {
  key: string
  name?: string
  category?: string
  imageUrl?: string
}

class IconService {
  private cache: YotoPublicIcon[] = []
  private cacheLoadedAt: Date | null = null
  private readonly CACHE_TTL_MS = 1000 * 60 * 60 // 1 heure

  async fetchPublicIcons(): Promise<YotoPublicIcon[]> {
    // Retourner cache si récent
    if (
      this.cache.length > 0 &&
      this.cacheLoadedAt &&
      Date.now() - this.cacheLoadedAt.getTime() < this.CACHE_TTL_MS
    ) {
      return this.cache
    }

    try {
      const res = await fetch('https://api.yoto.io/media/displayIcons/user/yoto', {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 }, // Cache Next.js 1h
      })

      if (!res.ok) {
        logger.warn({ status: res.status }, 'API Yoto icônes indisponible — fallback mock')
        return this.getMockIcons()
      }

      const data: unknown = await res.json()
      const icons = this.parseIconResponse(data)
      this.cache = icons
      this.cacheLoadedAt = new Date()
      return icons
    } catch (error) {
      logger.warn({ error }, 'Erreur fetch icônes Yoto — fallback mock')
      return this.getMockIcons()
    }
  }

  private parseIconResponse(data: unknown): YotoPublicIcon[] {
    // L'API Yoto retourne un format variable — on parse de manière défensive
    if (Array.isArray(data)) {
      return data.map((item, idx) => ({
        key:
          typeof item === 'object' && item !== null && 'key' in item
            ? String((item as Record<string, unknown>).key)
            : `icon-${idx}`,
        name:
          typeof item === 'object' && item !== null && 'name' in item
            ? String((item as Record<string, unknown>).name)
            : undefined,
        category:
          typeof item === 'object' && item !== null && 'category' in item
            ? String((item as Record<string, unknown>).category)
            : undefined,
        imageUrl:
          typeof item === 'object' && item !== null && 'imageUrl' in item
            ? String((item as Record<string, unknown>).imageUrl)
            : undefined,
      }))
    }
    return this.getMockIcons()
  }

  private getMockIcons(): YotoPublicIcon[] {
    return [
      { key: 'star', name: 'Étoile', category: 'shapes' },
      { key: 'heart', name: 'Cœur', category: 'shapes' },
      { key: 'music', name: 'Musique', category: 'media' },
      { key: 'book', name: 'Livre', category: 'education' },
      { key: 'moon', name: 'Lune', category: 'nature' },
      { key: 'sun', name: 'Soleil', category: 'nature' },
      { key: 'rocket', name: 'Fusée', category: 'space' },
      { key: 'dragon', name: 'Dragon', category: 'fantasy' },
      { key: 'crown', name: 'Couronne', category: 'royalty' },
      { key: 'robot', name: 'Robot', category: 'tech' },
      { key: 'flower', name: 'Fleur', category: 'nature' },
      { key: 'sword', name: 'Épée', category: 'adventure' },
    ]
  }

  async searchIcons(query: string): Promise<YotoPublicIcon[]> {
    const all = await this.fetchPublicIcons()
    if (!query.trim()) return all
    const q = query.toLowerCase()
    return all.filter(
      (icon) =>
        icon.name?.toLowerCase().includes(q) ||
        icon.key.toLowerCase().includes(q) ||
        icon.category?.toLowerCase().includes(q),
    )
  }

  async autoSuggestIcon(title: string): Promise<YotoPublicIcon | null> {
    const keywords = this.extractKeywords(title)
    const all = await this.fetchPublicIcons()

    for (const kw of keywords) {
      const match = all.find(
        (icon) =>
          icon.name?.toLowerCase().includes(kw) || icon.key.toLowerCase().includes(kw),
      )
      if (match) return match
    }
    return null
  }

  private extractKeywords(title: string): string[] {
    const stopWords = new Set(['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'the', 'a', 'an'])
    return title
      .toLowerCase()
      .split(/[\s\-_,]+/)
      .filter((w) => w.length > 2 && !stopWords.has(w))
      .slice(0, 5)
  }

  async assignIcon(
    sourceType: 'track' | 'playlist' | 'scenario',
    sourceId: string,
    iconKey: string,
    mode: 'manual' | 'auto' = 'manual',
    previewUrl?: string,
  ): Promise<void> {
    await prisma.iconMapping.upsert({
      where: { sourceType_sourceId: { sourceType, sourceId } },
      create: { sourceType, sourceId, iconKey, mode, previewUrl: previewUrl ?? null },
      update: { iconKey, mode, previewUrl: previewUrl ?? null },
    })

    logger.info({ sourceType, sourceId, iconKey, mode }, 'Icône assignée')
  }

  async getAssignment(sourceType: string, sourceId: string) {
    return prisma.iconMapping.findUnique({
      where: { sourceType_sourceId: { sourceType, sourceId } },
    })
  }
}

export const iconService = new IconService()
