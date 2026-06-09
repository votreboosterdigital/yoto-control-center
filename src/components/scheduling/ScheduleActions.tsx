'use client'

import { useRouter } from 'next/navigation'
import { ScheduleCard } from './ScheduleCard'
import { CreateScheduleForm } from './CreateScheduleForm'

interface Schedule {
  id: string
  scenarioId: string
  cron: string
  timezone: string
  enabled: boolean
  deviceId: string
  lastRunAt: string | null
  schedulerActive: boolean
}

interface Scenario {
  id: string
  name: string
}

interface ScheduleActionsProps {
  schedules: Schedule[]
  scenarios: Scenario[]
  deviceIds: string[]
}

export function ScheduleActions({ schedules, scenarios, deviceIds }: ScheduleActionsProps) {
  const router = useRouter()

  function refresh() {
    router.refresh()
  }

  const scenarioMap = new Map(scenarios.map((s) => [s.id, s.name]))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schedules.map((schedule) => (
          <ScheduleCard
            key={schedule.id}
            schedule={schedule}
            scenarioName={scenarioMap.get(schedule.scenarioId)}
            onUpdated={refresh}
          />
        ))}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Créer un schedule</h3>
        <div className="max-w-sm">
          <CreateScheduleForm
            scenarios={scenarios}
            deviceIds={deviceIds}
            onCreated={refresh}
          />
        </div>
      </div>
    </div>
  )
}
