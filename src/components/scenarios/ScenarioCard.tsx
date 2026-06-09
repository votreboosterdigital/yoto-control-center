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

  async function handleRun() {
    if (!selectedDevice) {
      toast.error('Sélectionne un appareil')
      return
    }

    setRunning(true)
    try {
      const res = await fetch(`/api/scenarios/${scenario.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDevice }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? 'Échec de l\'exécution')
      }

      toast.success(`Scénario "${scenario.name}" exécuté avec succès`)
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
        <p className="text-xs text-muted-foreground">
          {scenario.steps.length} étape{scenario.steps.length !== 1 ? 's' : ''}
        </p>

        {deviceIds.length > 0 && (
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
          disabled={!scenario.enabled || running || !selectedDevice}
          onClick={handleRun}
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
