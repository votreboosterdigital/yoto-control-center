import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Prisma avant tout import de IconService
vi.mock('@/lib/prisma', () => ({
  prisma: {
    iconMapping: {
      upsert: vi.fn().mockResolvedValue({}),
      findUnique: vi.fn().mockResolvedValue(null),
    },
  },
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock fetch global pour éviter des appels réseau réels
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('IconService — autoSuggestIcon (via extractKeywords)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Simuler une réponse réseau qui échoue → fallback sur getMockIcons()
    mockFetch.mockRejectedValue(new Error('réseau indisponible'))
  })

  it('"The Dragon Adventure" → trouve l\'icône dragon', async () => {
    const { iconService } = await import('@/server/services/IconService')
    const result = await iconService.autoSuggestIcon('The Dragon Adventure')
    // "the" filtré (stop word), "dragon" matche l'icône mock key="dragon"
    expect(result).not.toBeNull()
    expect(result?.key).toBe('dragon')
  })

  it('"Le Livre Magique" → trouve l\'icône book', async () => {
    const { iconService } = await import('@/server/services/IconService')
    const result = await iconService.autoSuggestIcon('Le Livre Magique')
    // "le" filtré (stop word), "livre" matche name="Livre" → key="book"
    expect(result).not.toBeNull()
    expect(result?.key).toBe('book')
  })

  it('"histoire du soir" → null (aucun match dans icônes mock)', async () => {
    const { iconService } = await import('@/server/services/IconService')
    const result = await iconService.autoSuggestIcon('histoire du soir')
    // "du" filtré (stop word), "histoire" et "soir" ne matchent pas les icônes mock
    expect(result).toBeNull()
  })

  it('"A B C" → null (tous les mots < 3 chars ou stop words)', async () => {
    const { iconService } = await import('@/server/services/IconService')
    const result = await iconService.autoSuggestIcon('A B C')
    expect(result).toBeNull()
  })

  it('"Mission Rocket Space" → trouve l\'icône rocket', async () => {
    const { iconService } = await import('@/server/services/IconService')
    const result = await iconService.autoSuggestIcon('Mission Rocket Space')
    // "rocket" matche key="rocket" dans les icônes mock
    expect(result).not.toBeNull()
    expect(result?.key).toBe('rocket')
  })
})

describe('IconService — searchIcons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockRejectedValue(new Error('réseau indisponible'))
  })

  it('retourne toutes les icônes si query vide', async () => {
    const { iconService } = await import('@/server/services/IconService')
    const results = await iconService.searchIcons('')
    expect(results.length).toBeGreaterThan(0)
  })

  it('filtre par query insensible à la casse', async () => {
    const { iconService } = await import('@/server/services/IconService')
    const results = await iconService.searchIcons('DRAGON')
    expect(results.some((i) => i.key === 'dragon')).toBe(true)
  })

  it('filtre par catégorie', async () => {
    const { iconService } = await import('@/server/services/IconService')
    const results = await iconService.searchIcons('nature')
    // moon et flower sont dans la catégorie "nature"
    expect(results.length).toBeGreaterThan(0)
    expect(results.every((i) => i.category === 'nature')).toBe(true)
  })

  it('retourne liste vide si query sans correspondance', async () => {
    const { iconService } = await import('@/server/services/IconService')
    const results = await iconService.searchIcons('xyznonexistent')
    expect(results).toHaveLength(0)
  })
})
