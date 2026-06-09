import { getProvider } from '@/lib/yoto'
import { eventBus } from '@/lib/events/bus'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import type { YotoEvent } from '@/lib/yoto/types'
import type { Prisma } from '@prisma/client'

class EventService {
  private unsubscribe: (() => Promise<void>) | null = null
  private started = false

  async start(): Promise<void> {
    if (this.started) return
    this.started = true

    const provider = getProvider()
    this.unsubscribe = await provider.subscribeToEvents(async (event) => {
      await this.handleEvent(event)
    })

    logger.info('EventService démarré')
  }

  async stop(): Promise<void> {
    if (this.unsubscribe) {
      await this.unsubscribe()
      this.unsubscribe = null
    }
    this.started = false
    logger.info('EventService arrêté')
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
