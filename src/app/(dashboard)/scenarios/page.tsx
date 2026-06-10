import { prisma } from '@/lib/prisma'
import { ScenarioCard } from '@/components/scenarios/ScenarioCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { getProvider } from '@/lib/yoto'
import type { ScenarioDefinition, ScenarioStep } from '@/lib/scenarios/types'

async function getScenarios(): Promise<ScenarioDefinition[]> {
  const rows = await prisma.scenario.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      enabled: true,
      steps: true,
      trigger: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return rows.map((row) => {
    const stepsRaw = row.steps
    const steps: ScenarioStep[] =
      typeof stepsRaw === 'string'
        ? (JSON.parse(stepsRaw) as ScenarioStep[])
        : (stepsRaw as unknown as ScenarioStep[])

    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? undefined,
      enabled: row.enabled,
      steps,
      trigger: row.trigger
        ? (typeof row.trigger === 'string'
            ? JSON.parse(row.trigger)
            : row.trigger) as ScenarioDefinition['trigger']
        : undefined,
    }
  })
}

async function getDeviceIds(): Promise<string[]> {
  try {
    const provider = getProvider()
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000)
    )
    const devices = await Promise.race([provider.listDevices(), timeout])
    return devices.map((d) => d.id)
  } catch {
    return []
  }
}

export default async function ScenariosPage() {
  const [scenarios, deviceIds] = await Promise.all([getScenarios(), getDeviceIds()])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Scénarios</h2>
        <span className="text-sm text-muted-foreground">
          {scenarios.length} scénario{scenarios.length !== 1 ? 's' : ''}
        </span>
      </div>

      {scenarios.length === 0 ? (
        <EmptyState
          icon="🎭"
          title="Aucun scénario configuré"
          description={
            <>
              Lance <code className="text-xs bg-muted px-1 rounded">npx prisma db seed</code> pour créer les scénarios par défaut.
            </>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} deviceIds={deviceIds} />
          ))}
        </div>
      )}
    </div>
  )
}
