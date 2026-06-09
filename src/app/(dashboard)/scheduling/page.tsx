import { prisma } from '@/lib/prisma'
import { schedulerService } from '@/server/services/SchedulerService'
import { getProvider } from '@/lib/yoto'
import { ScheduleActions } from '@/components/scheduling/ScheduleActions'
import { EmptyState } from '@/components/ui/EmptyState'

async function getSchedules() {
  const schedules = await prisma.schedule.findMany({ orderBy: { createdAt: 'asc' } })
  const activeIds = new Set(schedulerService.getActiveScheduleIds())
  return schedules.map((s) => ({
    ...s,
    lastRunAt: s.lastRunAt ? s.lastRunAt.toISOString() : null,
    schedulerActive: activeIds.has(s.id),
  }))
}

async function getScenarios() {
  return prisma.scenario.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'asc' },
  })
}

async function getDeviceIds(): Promise<string[]> {
  try {
    const provider = getProvider()
    const devices = await provider.listDevices()
    return devices.map((d) => d.id)
  } catch {
    return []
  }
}

export default async function SchedulingPage() {
  const [schedules, scenarios, deviceIds] = await Promise.all([
    getSchedules(),
    getScenarios(),
    getDeviceIds(),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Planning</h2>
        <span className="text-sm text-muted-foreground">
          {schedules.length} schedule{schedules.length !== 1 ? 's' : ''}
          {' · '}
          {schedules.filter((s) => s.schedulerActive).length} actif{schedules.filter((s) => s.schedulerActive).length !== 1 ? 's' : ''}
        </span>
      </div>

      {schedules.length === 0 && (
        <EmptyState
          icon="🗓️"
          title="Aucun planning configuré"
          description={
            <>
              Lance <code className="text-xs bg-muted px-1 rounded">npx prisma db seed</code> pour créer le schedule de démo.
            </>
          }
        />
      )}

      <ScheduleActions schedules={schedules} scenarios={scenarios} deviceIds={deviceIds} />
    </div>
  )
}
