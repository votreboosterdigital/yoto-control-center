'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { IconAssigner } from '@/components/icons/IconAssigner'
import type { ScenarioDefinition } from '@/lib/scenarios/types'

interface ScenarioCardProps {
  scenario: ScenarioDefinition
  deviceIds?: string[]
}

export function ScenarioCard({ scenario, deviceIds = [] }: ScenarioCardProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>(deviceIds[0] ?? '')
  const [running, setRunning] = useState(false)
  const [cardId, setCardId] = useState('')

  const needsCardId = scenario.steps.some((s) => s.type === 'play_playlist')

  async function handleRun() {
    if (!selectedDevice) {
      toast.error('Sélectionne un appareil')
      return
    }
    if (needsCardId && !cardId.trim()) {
      toast.error('Entre l\'ID de la carte à jouer')
      return
    }

    setRunning(true)
    try {
      const body: Record<string, unknown> = { deviceId: selectedDevice }
      if (needsCardId && cardId.trim()) {
        body.runtimeParams = { cardId: cardId.trim() }
      }

      const res = await fetch(`/api/scenarios/${scenario.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Échec de l\'exécution')
      }

      toast.success(`Scénario "${scenario.name}" exécuté`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur inconnue')
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{scenario.name}</CardTitle>
          <Badge variant={scenario.enabled ? 'default' : 'secondary'}>
            {scenario.enabled ? 'Actif' : 'Inactif'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {scenario.description && (
          <p className="text-sm text-muted-foreground">{scenario.description}</p>
        )}

        <div className="text-xs text-muted-foreground space-y-0.5">
          {scenario.steps.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="text-muted-foreground/50">{s.order}.</span>
              <span>{stepLabel(s.type)}</span>
              {s.type === 'set_volume' && (
                <span className="text-muted-foreground/70">→ {String(s.params.volume)}%</span>
              )}
              {s.type === 'wait' && (
                <span className="text-muted-foreground/70">→ {String(s.params.durationSeconds)}s</span>
              )}
              {s.type === 'play_playlist' && (
                <span className="text-muted-foreground/70 italic">→ ID requis</span>
              )}
            </div>
          ))}
        </div>

        {needsCardId && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">ID de carte</label>
            <input
              type="text"
              className="w-full h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Ex: ABC123DEF (depuis la page Appareils)"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              disabled={running}
            />
          </div>
        )}

        {deviceIds.length > 1 && (
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            {deviceIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        )}

        <Button
          size="sm"
          className="w-full"
          disabled={!scenario.enabled || running || !selectedDevice || (needsCardId && !cardId.trim())}
          onClick={() => void handleRun()}
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {running ? 'Exécution...' : 'Exécuter'}
        </Button>

        <div className="pt-1 border-t">
          <p className="text-xs text-muted-foreground mb-2">Icône</p>
          <IconAssigner
            sourceType="scenario"
            sourceId={scenario.id}
            title={scenario.name}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function stepLabel(type: string): string {
  switch (type) {
    case 'play_playlist': return '▶ Jouer carte'
    case 'pause': return '⏸ Pause'
    case 'resume': return '▶ Reprendre'
    case 'set_volume': return '🔊 Volume'
    case 'wait': return '⏳ Attendre'
    case 'play_stream': return '📻 Stream'
    default: return type
  }
}
