import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { schedulerService } from '@/server/services/SchedulerService'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ scheduleId: string }> }

// GET /api/schedules/[scheduleId]
export async function GET(_req: Request, { params }: RouteContext) {
  const { scheduleId } = await params
  try {
    const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } })
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }
    return NextResponse.json({
      schedule: {
        ...schedule,
        schedulerActive: schedulerService.isScheduled(scheduleId),
      },
    })
  } catch (error) {
    logger.error({ error, scheduleId }, 'GET /api/schedules/[scheduleId] failed')
    return NextResponse.json({ error: 'Failed to get schedule' }, { status: 500 })
  }
}

const updateScheduleSchema = z.object({
  enabled: z.boolean().optional(),
  cron: z.string().min(1).optional(),
  timezone: z.string().optional(),
})

// PATCH /api/schedules/[scheduleId] — met à jour enabled/cron/timezone
export async function PATCH(req: Request, { params }: RouteContext) {
  const { scheduleId } = await params
  try {
    const body: unknown = await req.json()
    const parsed = updateScheduleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.cron !== undefined && { cron: data.cron }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
      },
    })

    // Gérer l'état dans le scheduler
    if (data.enabled === false) {
      // Désactivé → stopper dans le scheduler
      schedulerService.stopOne(scheduleId)
    } else if (data.enabled === true || data.cron !== undefined || data.timezone !== undefined) {
      // Réactivé ou expression modifiée → replanifier
      schedulerService.stopOne(scheduleId)
      if (schedule.enabled) {
        schedulerService.scheduleOne(schedule)
      }
    }

    return NextResponse.json({
      schedule: {
        ...schedule,
        schedulerActive: schedulerService.isScheduled(scheduleId),
      },
    })
  } catch (error) {
    logger.error({ error, scheduleId }, 'PATCH /api/schedules/[scheduleId] failed')
    const isNotFound = error instanceof Error && error.message.includes('Record to update not found')
    return NextResponse.json(
      { error: isNotFound ? 'Schedule not found' : 'Failed to update schedule' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}

// DELETE /api/schedules/[scheduleId]
export async function DELETE(_req: Request, { params }: RouteContext) {
  const { scheduleId } = await params
  try {
    await prisma.schedule.delete({ where: { id: scheduleId } })
    schedulerService.stopOne(scheduleId)
    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error, scheduleId }, 'DELETE /api/schedules/[scheduleId] failed')
    const isNotFound = error instanceof Error && error.message.includes('Record to delete does not exist')
    return NextResponse.json(
      { error: isNotFound ? 'Schedule not found' : 'Failed to delete schedule' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}
