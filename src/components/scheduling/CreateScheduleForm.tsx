'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface Scenario {
  id: string
  name: string
}

interface CreateScheduleFormProps {
  scenarios: Scenario[]
  deviceIds: string[]
  onCreated: () => void
}

const TIMEZONES = [
  'America/Montreal',
  'America/Toronto',
  'America/New_York',
  'Europe/Paris',
  'UTC',
]

function validateCron(expression: string): boolean {
  const parts = expression.trim().split(/\s+/)
  return parts.length === 5
}

function describeCron(expression: string): string {
  const parts = expression.trim().split(/\s+/)
  if (parts.length !== 5) return ''
  const [minute, hour, dom, month, dow] = parts
  if (dow === '*' && dom === '*' && month === '*') {
    if (hour !== '*' && minute !== '*') {
      return `Tous les jours à ${hour.padStart(2, '0')}h${minute.padStart(2, '0')}`
    }
  }
  return `Cron valide (5 champs)`
}

export function CreateScheduleForm({ scenarios, deviceIds, onCreated }: CreateScheduleFormProps) {
  const [scenarioId, setScenarioId] = useState(scenarios[0]?.id ?? '')
  const [cronExpr, setCronExpr] = useState('30 20 * * *')
  const [timezone, setTimezone] = useState('America/Montreal')
  const [deviceId, setDeviceId] = useState(deviceIds[0] ?? 'mock-player-1')
  const [loading, setLoading] = useState(false)

  const cronValid = validateCron(cronExpr)
  const cronDescription = cronValid ? describeCron(cronExpr) : 'Expression invalide (5 champs requis)'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cronValid) {
      toast.error('Expression cron invalide — 5 champs requis')
      return
    }
    if (!scenarioId || !deviceId) {
      toast.error('Scénario et device requis')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId, cron: cronExpr.trim(), timezone, deviceId }),
      })
      const data = (await res.json()) as { schedule?: unknown; error?: unknown }
      if (!res.ok) throw new Error(typeof data.error === 'string' ? data.error : 'Erreur création')
      toast.success('Schedule créé et activé')
      onCreated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Nouveau schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Scénario</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              required
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Expression cron</label>
            <input
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm font-mono"
              placeholder="* * * * *"
              value={cronExpr}
              onChange={(e) => setCronExpr(e.target.value)}
              required
            />
            <p className={`text-xs ${cronValid ? 'text-muted-foreground' : 'text-destructive'}`}>
              {cronExpr ? cronDescription : 'Format : minute heure jour-du-mois mois jour-de-semaine'}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Timezone</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Device</label>
            {deviceIds.length > 0 ? (
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                required
              >
                {deviceIds.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                placeholder="mock-player-1"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                required
              />
            )}
          </div>

          <Button type="submit" size="sm" className="w-full" disabled={loading || !cronValid}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {loading ? 'Création...' : 'Créer le schedule'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
