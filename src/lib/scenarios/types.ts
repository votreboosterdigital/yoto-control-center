export type ScenarioStepType =
  | 'play_playlist'
  | 'play_stream'
  | 'pause'
  | 'resume'
  | 'set_volume'
  | 'wait'
  | 'assign_icon'

export interface ScenarioStep {
  id: string
  type: ScenarioStepType
  params: Record<string, unknown>
  order: number
}

export interface ScenarioDefinition {
  id: string
  slug: string
  name: string
  description?: string
  enabled: boolean
  steps: ScenarioStep[]
  trigger?: ScenarioTrigger
}

export interface ScenarioTrigger {
  type: 'manual' | 'schedule' | 'event'
  config?: Record<string, unknown>
}
