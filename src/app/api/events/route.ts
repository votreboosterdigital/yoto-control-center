import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsedLimit = parseInt(searchParams.get('limit') ?? '50', 10)
    const limit = Math.min(isNaN(parsedLimit) ? 50 : parsedLimit, 200)
    const deviceId = searchParams.get('deviceId') ?? undefined

    const events = await prisma.eventLog.findMany({
      where: deviceId ? { deviceId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        deviceId: true,
        payload: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    logger.error({ error }, 'GET /api/events failed')
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
