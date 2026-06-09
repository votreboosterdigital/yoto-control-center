'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play, Zap, Trash2 } from 'lucide-react'

interface ScheduleCardProps {
  schedule: {
    id: string
    scenarioId: string
    cron: string
    timezone: string
    enabled: boolean
    deviceId: string
    lastRunAt: string | null
    schedulerActive: boolean
  }
  scenarioName?: string
  onUpdated: () => void
}

export function ScheduleCard({ schedule, scenarioName, onUpdated }: ScheduleCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleRun(dryRun: boolean) {
    setLoading(true)
    try {
      const res = await fetch(`/api/schedules/${schedule.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      })
      const data = (await res.json()) as { success?: boolean; runId?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Erreur')
      toast.success(dryRun ? 'Dry-run effectué (aucune action réelle)' : `Run lancé : ${data.runId}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !schedule.enabled }),
      })
      if (!res.ok) throw new Error('Erreur mise à jour')
      toast.success(schedule.enabled ? 'Schedule désactivé' : 'Schedule activé')
      onUpdated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Supprimer ce schedule ?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      toast.success('Schedule supprimé')
      onUpdated()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const lastRun = schedule.lastRunAt
    ? new Date(schedule.lastRunAt).toLocaleString('fr-CA', { timeZone: schedule.timezone })
    : null

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base truncate">{scenarioName ?? schedule.scenarioId}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant={schedule.schedulerActive ? 'default' : 'secondary'}>
              {schedule.schedulerActive ? 'Actif' : 'Inactif'}
            </Badge>
            {!schedule.enabled && (
              <Badge variant="outline" className="text-xs">Désactivé</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1 text-sm">
          <p className="font-mono text-xs bg-muted px-2 py-1 rounded">{schedule.cron}</p>
          <p className="text-xs text-muted-foreground">
            Timezone : {schedule.timezone}
          </p>
          <p className="text-xs text-muted-foreground">
            Device : {schedule.deviceId}
          </p>
          {lastRun && (
            <p className="text-xs text-muted-foreground">
              Dernier run : {lastRun}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="default"
            disabled={loading}
            onClick={() => handleRun(false)}
          >
            <Play className="mr-1.5 h-3.5 w-3.5" />
            Run now
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={() => handleRun(true)}
          >
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            Dry run
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={loading}
            onClick={handleToggle}
          >
            {schedule.enabled ? 'Désactiver' : 'Activer'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={loading}
            onClick={handleDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
