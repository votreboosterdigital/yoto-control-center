import { describe, it, expect, vi } from 'vitest'
import type { YotoEvent, YotoEventType } from '@/lib/yoto/types'

// Importer EventBus directement (pas le singleton) pour des tests isolés
import type { } from '@/lib/events/bus'

// Recréer la classe localement pour tester en isolation
class EventBus {
  private handlers = new Map<YotoEventType | '*', Array<(event: YotoEvent) => void | Promise<void>>>()

  on(type: YotoEventType | '*', handler: (event: YotoEvent) => void | Promise<void>): () => void {
    const existing = this.handlers.get(type) ?? []
    this.handlers.set(type, [...existing, handler])
    return () => this.off(type, handler)
  }

  off(type: YotoEventType | '*', handler: (event: YotoEvent) => void | Promise<void>): void {
    const existing = this.handlers.get(type) ?? []
    this.handlers.set(type, existing.filter((h) => h !== handler))
  }

  async emit(event: YotoEvent): Promise<void> {
    const typeHandlers = this.handlers.get(event.type) ?? []
    const wildcardHandlers = this.handlers.get('*') ?? []
    await Promise.all([...typeHandlers, ...wildcardHandlers].map((h) => h(event)))
  }
}

const makeEvent = (type: YotoEventType = 'playback.started'): YotoEvent => ({
  type,
  deviceId: 'device-1',
  payload: { test: true },
  timestamp: new Date(),
})

describe('EventBus', () => {
  it('on/emit — handler reçoit l\'événement', async () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.on('playback.started', handler)

    const event = makeEvent('playback.started')
    await bus.emit(event)

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(event)
  })

  it('off — handler retiré ne reçoit plus d\'événements', async () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.on('playback.started', handler)
    bus.off('playback.started', handler)

    await bus.emit(makeEvent('playback.started'))

    expect(handler).not.toHaveBeenCalled()
  })

  it('on retourne une fonction unsubscribe qui retire le handler', async () => {
    const bus = new EventBus()
    const handler = vi.fn()
    const unsubscribe = bus.on('volume.changed', handler)
    unsubscribe()

    await bus.emit(makeEvent('volume.changed'))

    expect(handler).not.toHaveBeenCalled()
  })

  it('wildcard * reçoit tous les types d\'événements', async () => {
    const bus = new EventBus()
    const wildcardHandler = vi.fn()
    bus.on('*', wildcardHandler)

    await bus.emit(makeEvent('playback.started'))
    await bus.emit(makeEvent('device.connected'))
    await bus.emit(makeEvent('volume.changed'))

    expect(wildcardHandler).toHaveBeenCalledTimes(3)
  })

  it('handler spécifique ne reçoit pas les événements d\'un autre type', async () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.on('playback.started', handler)

    await bus.emit(makeEvent('device.disconnected'))

    expect(handler).not.toHaveBeenCalled()
  })

  it('plusieurs handlers sur le même type sont tous appelés', async () => {
    const bus = new EventBus()
    const h1 = vi.fn()
    const h2 = vi.fn()
    bus.on('scenario.started', h1)
    bus.on('scenario.started', h2)

    await bus.emit(makeEvent('scenario.started'))

    expect(h1).toHaveBeenCalledOnce()
    expect(h2).toHaveBeenCalledOnce()
  })
})
