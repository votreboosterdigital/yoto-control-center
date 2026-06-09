'use client'

import { useEvents } from '@/hooks/useEvents'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyState } from '@/components/ui/EmptyState'

const EVENT_COLORS: Record<string, string> = {
  'device.connected': 'bg-green-100 text-green-800',
  'device.disconnected': 'bg-red-100 text-red-800',
  'playback.started': 'bg-blue-100 text-blue-800',
  'playback.paused': 'bg-yellow-100 text-yellow-800',
  'playback.finished': 'bg-gray-100 text-gray-800',
  'playback.track_changed': 'bg-purple-100 text-purple-800',
  'volume.changed': 'bg-orange-100 text-orange-800',
  'scenario.started': 'bg-indigo-100 text-indigo-800',
  'scenario.failed': 'bg-red-100 text-red-800',
}

interface Props {
  deviceId?: string
  title?: string
}

export function EventFeed({ deviceId, title = 'Événements récents' }: Props) {
  const { events, loading } = useEvents(deviceId)

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {loading ? (
        <p className="text-xs text-muted-foreground">Chargement...</p>
      ) : (
        <ScrollArea className="h-64">
          <div className="space-y-1 pr-2">
            {events.length === 0 ? (
              <EmptyState
                icon="📡"
                title="Aucun événement"
                description="Les événements apparaîtront ici en temps réel."
              />
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="flex items-center gap-2 text-xs py-1 border-b">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono ${EVENT_COLORS[ev.type] ?? 'bg-muted'}`}
                  >
                    {ev.type}
                  </span>
                  {ev.deviceId && (
                    <span className="text-muted-foreground truncate max-w-24">{ev.deviceId}</span>
                  )}
                  <span className="text-muted-foreground ml-auto">
                    {new Date(ev.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
