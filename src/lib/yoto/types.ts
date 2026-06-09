export interface Device {
  id: string
  name: string
  type: 'player' | 'mini'
  online: boolean
  volume: number
  currentPlayback?: PlaybackState
  batteryLevel?: number
  lastSeenAt?: Date
}

export interface PlaybackState {
  deviceId: string
  status: 'idle' | 'playing' | 'paused' | 'buffering' | 'offline'
  contentId?: string
  contentType?: 'playlist' | 'stream' | 'radio' | 'podcast' | 'card' | 'custom'
  trackIndex?: number
  trackTitle?: string
  positionSeconds?: number
  updatedAt: Date
}

export type YotoEventType =
  | 'device.connected'
  | 'device.disconnected'
  | 'playback.started'
  | 'playback.paused'
  | 'playback.finished'
  | 'playback.track_changed'
  | 'volume.changed'
  | 'scenario.started'
  | 'scenario.step_completed'
  | 'scenario.failed'
  | 'schedule.triggered'
  | 'icon.assigned'

export interface YotoEvent {
  type: YotoEventType
  deviceId?: string
  payload: Record<string, unknown>
  timestamp: Date
}
