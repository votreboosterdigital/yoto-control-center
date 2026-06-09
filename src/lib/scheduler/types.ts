export interface ScheduleDefinition {
  id: string
  scenarioId: string
  cron: string
  timezone: string
  enabled: boolean
  deviceId: string
  lastRunAt?: Date
}
