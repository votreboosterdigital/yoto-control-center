import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { schedulerService } from '@/server/services/SchedulerService'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ scheduleId: string }> }

// POST /api/schedules/[scheduleId]/run — run now (optionnel dry run)
export async function POST(req: Request, { params }: RouteContext) {
  const { scheduleId } = await params
  try {
    const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } })
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    const body = await req.json() as { dryRun?: boolean }
    const dryRun = body.dryRun ?? false

    const runId = await schedulerService.triggerSchedule(
      scheduleId,
      schedule.scenarioId,
      schedule.deviceId,
      dryRun
    )

    return NextResponse.json({ success: true, runId, dryRun })
  } catch (error) {
    logger.error({ error, scheduleId }, 'POST /api/schedules/[scheduleId]/run failed')

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('disabled')) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
    }

    return NextResponse.json({ error: 'Failed to run schedule' }, { status: 500 })
  }
}
