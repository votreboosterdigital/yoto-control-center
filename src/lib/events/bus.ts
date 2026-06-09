import type { YotoEvent, YotoEventType } from '@/lib/yoto/types'

type EventHandler = (event: YotoEvent) => void | Promise<void>

class EventBus {
  private handlers = new Map<YotoEventType | '*', EventHandler[]>()

  on(type: YotoEventType | '*', handler: EventHandler): () => void {
    const existing = this.handlers.get(type) ?? []
    this.handlers.set(type, [...existing, handler])
    return () => this.off(type, handler)
  }

  off(type: YotoEventType | '*', handler: EventHandler): void {
    const existing = this.handlers.get(type) ?? []
    this.handlers.set(type, existing.filter((h) => h !== handler))
  }

  async emit(event: YotoEvent): Promise<void> {
    const typeHandlers = this.handlers.get(event.type) ?? []
    const wildcardHandlers = this.handlers.get('*') ?? []
    await Promise.all([...typeHandlers, ...wildcardHandlers].map((h) => h(event)))
  }
}

export const eventBus = new EventBus()
