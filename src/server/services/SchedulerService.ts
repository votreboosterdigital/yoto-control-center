import { schedule as cronSchedule, validate as cronValidate } from 'node-cron'
import type { ScheduledTask } from 'node-cron'
import { prisma } from '@/lib/prisma'
import { scenarioRunner } from './ScenarioRunner'
import { eventBus } from '@/lib/events/bus'
import { logger } from '@/lib/logger'

class SchedulerService {
  private tasks = new Map<string, ScheduledTask>()
  private started = false

  async start(): Promise<void> {
    if (this.started) return
    this.started = true
    await this.loadAndScheduleAll()
    logger.info('SchedulerService démarré')
  }

  async stop(): Promise<void> {
    for (const [id, task] of this.tasks) {
      await task.stop()
      logger.debug({ id }, 'Schedule stopped')
    }
    this.tasks.clear()
    this.started = false
    logger.info('SchedulerService arrêté')
  }

  private async loadAndScheduleAll(): Promise<void> {
    const schedules = await prisma.schedule.findMany({ where: { enabled: true } })
    for (const s of schedules) {
      this.scheduleOne(s)
    }
    logger.info({ count: schedules.length }, 'Schedules chargés')
  }

  scheduleOne(schedule: { id: string; cron: string; timezone: string; scenarioId: string; deviceId: string }): void {
    // Valider le cron avant de scheduler
    if (!cronValidate(schedule.cron)) {
      logger.warn({ scheduleId: schedule.id, cron: schedule.cron }, 'Expression cron invalide, schedule ignoré')
      return
    }

    const task = cronSchedule(
      schedule.cron,
      async () => {
        await this.triggerSchedule(schedule.id, schedule.scenarioId, schedule.deviceId)
      },
      { timezone: schedule.timezone }
    )

    this.tasks.set(schedule.id, task)
    logger.debug({ scheduleId: schedule.id, cron: schedule.cron }, 'Schedule enregistré')
  }

  stopOne(scheduleId: string): void {
    const task = this.tasks.get(scheduleId)
    if (task) {
      void task.stop()
      this.tasks.delete(scheduleId)
    }
  }

  async triggerSchedule(scheduleId: string, scenarioId: string, deviceId: string, dryRun = false): Promise<string> {
    logger.info({ scheduleId, scenarioId, deviceId, dryRun }, 'Schedule déclenché')

    if (dryRun) {
      logger.info({ scheduleId }, 'Dry-run — aucune action exécutée')
      return 'dry-run'
    }

    const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } })
    if (!schedule) throw new Error(`Schedule ${scheduleId} not found`)

    try {
      const runId = await scenarioRunner.run(scenarioId, deviceId)

      await prisma.schedule.update({
        where: { id: scheduleId },
        data: { lastRunAt: new Date() },
      })

      await eventBus.emit({
        type: 'schedule.triggered',
        deviceId,
        payload: { scheduleId, scenarioId, runId },
        timestamp: new Date(),
      })

      return runId
    } catch (error) {
      logger.error({ error, scheduleId, scenarioId }, 'Erreur exécution schedule')
      throw error
    }
  }

  isScheduled(scheduleId: string): boolean {
    return this.tasks.has(scheduleId)
  }

  getActiveScheduleIds(): string[] {
    return Array.from(this.tasks.keys())
  }
}

export const schedulerService = new SchedulerService()
