import type { YotoProvider } from './provider'
import type { Device, PlaybackState, YotoEvent } from './types'
import { logger } from '@/lib/logger'

export class RealYotoProvider implements YotoProvider {
  // Sera implémenté en Phase 2 avec yoto-nodejs-client
  async authenticate(): Promise<void> {
    logger.info('RealYotoProvider.authenticate — not yet implemented')
    throw new Error('RealYotoProvider not yet implemented — use ENABLE_MOCK_PROVIDER=true')
  }

  async listDevices(): Promise<Device[]> { throw new Error('Not implemented') }
  async getDevice(_deviceId: string): Promise<Device> { throw new Error('Not implemented') }
  async getPlaybackState(_deviceId: string): Promise<PlaybackState> { throw new Error('Not implemented') }
  async playPlaylist(_deviceId: string, _playlistId: string): Promise<void> { throw new Error('Not implemented') }
  async playStream(_deviceId: string, _streamUrl: string): Promise<void> { throw new Error('Not implemented') }
  async pause(_deviceId: string): Promise<void> { throw new Error('Not implemented') }
  async resume(_deviceId: string): Promise<void> { throw new Error('Not implemented') }
  async setVolume(_deviceId: string, _volume: number): Promise<void> { throw new Error('Not implemented') }
  async subscribeToEvents(_onEvent: (event: YotoEvent) => void): Promise<() => Promise<void>> { throw new Error('Not implemented') }
}
