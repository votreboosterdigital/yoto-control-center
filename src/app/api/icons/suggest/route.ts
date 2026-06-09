import { NextResponse } from 'next/server'
import { iconService } from '@/server/services/IconService'
import { logger } from '@/lib/logger'

// GET /api/icons/suggest?title=histoire+du+soir
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url)
    const title = searchParams.get('title') ?? ''

    if (!title.trim()) {
      return NextResponse.json({ error: 'Paramètre title requis' }, { status: 400 })
    }

    const icon = await iconService.autoSuggestIcon(title)

    return NextResponse.json({ icon })
  } catch (error) {
    logger.error({ error }, 'GET /api/icons/suggest failed')
    return NextResponse.json({ error: 'Erreur lors de la suggestion d\'icône' }, { status: 500 })
  }
}
