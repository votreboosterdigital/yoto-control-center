import { NextResponse } from 'next/server'
import { iconService } from '@/server/services/IconService'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ sourceType: string; sourceId: string }> }

// GET /api/icons/[sourceType]/[sourceId]
export async function GET(_req: Request, { params }: RouteContext): Promise<NextResponse> {
  const { sourceType, sourceId } = await params

  try {
    const assignment = await iconService.getAssignment(sourceType, sourceId)

    if (!assignment) {
      return NextResponse.json({ assignment: null })
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    logger.error({ error, sourceType, sourceId }, 'GET /api/icons/[sourceType]/[sourceId] failed')
    return NextResponse.json({ error: 'Erreur lors de la récupération de l\'icône' }, { status: 500 })
  }
}
