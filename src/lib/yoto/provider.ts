import type { Device, PlaybackState, YotoEvent } from './types'

export interface YotoProvider {
  authenticate(): Promise<void>
  listDevices(): Promise<Device[]>
  getDevice(deviceId: string): Promise<Device>
  getPlaybackState(deviceId: string): Promise<PlaybackState>
  playPlaylist(deviceId: string, playlistId: string): Promise<void>
  playStream(deviceId: string, streamUrl: string): Promise<void>
  pause(deviceId: string): Promise<void>
  resume(deviceId: string): Promise<void>
  setVolume(deviceId: string, volume: number): Promise<void>
  subscribeToEvents(onEvent: (event: YotoEvent) => void): Promise<() => Promise<void>>
  displayPreview(deviceId: string, uri: string, timeoutSeconds: number, animated?: boolean): Promise<void>
}
