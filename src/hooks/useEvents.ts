'use client'

import { useEffect, useState } from 'react'

export interface EventLogEntry {
  id: string
  type: string
  deviceId: string | null
  payload: unknown
  createdAt: string
}

export function useEvents(deviceId?: string, intervalMs = 5000) {
  const [events, setEvents] = useState<EventLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const url = `/api/events?limit=20${deviceId ? `&deviceId=${encodeURIComponent(deviceId)}` : ''}`
        const res = await fetch(url)
        if (res.ok) {
          const data = (await res.json()) as { events: EventLogEntry[] }
          setEvents(data.events)
        }
      } catch {
        // Silencieux — polling
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
    const interval = setInterval(fetchEvents, intervalMs)
    return () => clearInterval(interval)
  }, [deviceId, intervalMs])

  return { events, loading }
}
