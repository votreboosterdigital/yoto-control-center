import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ scenarioId: string }> }

// GET /api/scenarios/[scenarioId]/runs — historique des runs
export async function GET(_req: Request, { params }: RouteContext) {
  const { scenarioId } = await params
  try {
    const runs = await prisma.scenarioRun.findMany({
      where: { scenarioId },
      select: {
        id: true,
        scenarioId: true,
        deviceId: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        error: true,
        log: true,
      },
      orderBy: { startedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ runs })
  } catch (error) {
    logger.error({ error, scenarioId }, 'GET /api/scenarios/[scenarioId]/runs failed')
    return NextResponse.json({ error: 'Failed to list runs' }, { status: 500 })
  }
}
