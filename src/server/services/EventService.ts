import { getProvider } from '@/lib/yoto'
import { eventBus } from '@/lib/events/bus'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import type { YotoEvent } from '@/lib/yoto/types'
import type { Prisma } from '@prisma/client'

const MAX_EVENT_LOGS = 500

class EventService {
  private unsubscribe: (() => Promise<void>) | null = null
  private started = false
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  async start(): Promise<void> {
    if (this.started) return
    this.started = true

    const provider = getProvider()
    this.unsubscribe = await provider.subscribeToEvents(async (event) => {
      await this.handleEvent(event)
    })

    // Nettoyage toutes les 10 minutes — garde seulement les 500 derniers événements
    this.cleanupTimer = setInterval(() => { void this.pruneEventLogs() }, 10 * 60 * 1000)

    logger.info('EventService démarré')
  }

  async stop(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    if (this.unsubscribe) {
      await this.unsubscribe()
      this.unsubscribe = null
    }
    this.started = false
    logger.info('EventService arrêté')
  }

  private async pruneEventLogs(): Promise<void> {
    try {
      const count = await prisma.eventLog.count()
      if (count <= MAX_EVENT_LOGS) return

      // Garder uniquement les MAX_EVENT_LOGS plus récents
      const oldest = await prisma.eventLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip: MAX_EVENT_LOGS,
        select: { id: true },
      })
      if (oldest.length === 0) return

      const ids = oldest.map((e) => e.id)
      await prisma.eventLog.deleteMany({ where: { id: { in: ids } } })
      logger.info({ deleted: ids.length }, 'EventLog pruned')
    } catch (error) {
      logger.warn({ error }, 'EventLog prune failed')
    }
  }

  private async handleEvent(event: YotoEvent): Promise<void> {
    try {
      // Persister en DB — payload est Json dans le schéma Prisma
      // Cast requis car Prisma 7 utilise InputJsonValue strict
      await prisma.eventLog.create({
        data: {
          type: event.type,
          deviceId: event.deviceId ?? null,
          payload: event.payload as Prisma.InputJsonValue,
        },
      })

      // Émettre sur le bus interne
      await eventBus.emit(event)

      logger.debug({ event }, 'Événement traité')
    } catch (error) {
      logger.error({ error, event }, 'Erreur traitement événement')
    }
  }

  isStarted(): boolean {
    return this.started
  }
}

export const eventService = new EventService()
