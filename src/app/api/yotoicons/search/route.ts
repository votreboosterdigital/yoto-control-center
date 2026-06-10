import { NextResponse } from 'next/server'
import { scrapeIconsByTag } from '@/lib/yotoicons/scraper'
import { logger } from '@/lib/logger'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get('tag')?.trim()

  if (!tag) {
    return NextResponse.json({ error: 'Paramètre tag requis' }, { status: 400 })
  }

  try {
    const icons = await scrapeIconsByTag(tag)
    logger.info({ tag, count: icons.length }, 'yotoicons scrape terminé')
    return NextResponse.json({ icons, total: icons.length })
  } catch (error) {
    logger.error({ error, tag }, 'GET /api/yotoicons/search failed')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}
