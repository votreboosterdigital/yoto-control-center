import type { YotoProvider } from './provider'
import type { Device, PlaybackState, YotoEvent } from './types'

export class MockYotoProvider implements YotoProvider {
  async authenticate(): Promise<void> {}

  async listDevices(): Promise<Device[]> {
    return [
      {
        id: 'mock-device-1',
        name: 'Yoto de Sofia',
        type: 'player',
        online: true,
        volume: 50,
        lastSeenAt: new Date(),
      },
    ]
  }

  async getDevice(deviceId: string): Promise<Device> {
    return {
      id: deviceId,
      name: 'Yoto de Sofia',
      type: 'player',
      online: true,
      volume: 50,
    }
  }

  async getPlaybackState(deviceId: string): Promise<PlaybackState> {
    return {
      deviceId,
      status: 'idle',
      updatedAt: new Date(),
    }
  }

  async playPlaylist(_deviceId: string, _playlistId: string): Promise<void> {}
  async playStream(_deviceId: string, _streamUrl: string): Promise<void> {}
  async pause(_deviceId: string): Promise<void> {}
  async resume(_deviceId: string): Promise<void> {}
  async setVolume(_deviceId: string, _volume: number): Promise<void> {}

  async subscribeToEvents(_onEvent: (event: YotoEvent) => void): Promise<() => Promise<void>> {
    return async () => {}
  }
}
