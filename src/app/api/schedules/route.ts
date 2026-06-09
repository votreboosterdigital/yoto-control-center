import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { schedulerService } from '@/server/services/SchedulerService'
import { logger } from '@/lib/logger'

// GET /api/schedules — liste tous les schedules avec status actif dans le scheduler
export async function GET() {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: { createdAt: 'asc' },
    })

    const activeIds = new Set(schedulerService.getActiveScheduleIds())

    const result = schedules.map((s) => ({
      ...s,
      schedulerActive: activeIds.has(s.id),
    }))

    return NextResponse.json({ schedules: result })
  } catch (error) {
    logger.error({ error }, 'GET /api/schedules failed')
    return NextResponse.json({ error: 'Failed to list schedules' }, { status: 500 })
  }
}

const createScheduleSchema = z.object({
  scenarioId: z.string().min(1),
  cron: z.string().min(1),
  timezone: z.string().default('America/Montreal'),
  deviceId: z.string().min(1),
})

// POST /api/schedules — crée un schedule et l'active immédiatement
export async function POST(req: Request) {
  try {
    const body: unknown = await req.json()
    const parsed = createScheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { scenarioId, cron, timezone, deviceId } = parsed.data

    const schedule = await prisma.schedule.create({
      data: { scenarioId, cron, timezone, deviceId, enabled: true },
    })

    // Activer immédiatement dans le scheduler
    schedulerService.scheduleOne(schedule)

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'POST /api/schedules failed')
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
  }
}
