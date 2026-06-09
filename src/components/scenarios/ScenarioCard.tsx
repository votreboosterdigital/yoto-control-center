import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ScenarioDefinition } from '@/lib/scenarios/types'

interface ScenarioCardProps {
  scenario: ScenarioDefinition
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
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
      <CardContent>
        {scenario.description && (
          <p className="text-sm text-muted-foreground">{scenario.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          {scenario.steps.length} étape{scenario.steps.length !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  )
}
