import { NextResponse } from 'next/server'
import { iconService } from '@/server/services/IconService'
import { logger } from '@/lib/logger'

// GET /api/icons/search?q=dragon&limit=20
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') ?? ''
    const limit = Math.min(Number(searchParams.get('limit') ?? '24'), 100)

    const results = await iconService.searchIcons(q)
    const icons = results.slice(0, limit)

    return NextResponse.json({ icons, total: results.length })
  } catch (error) {
    logger.error({ error }, 'GET /api/icons/search failed')
    return NextResponse.json({ error: 'Erreur lors de la recherche d\'icônes' }, { status: 500 })
  }
}
