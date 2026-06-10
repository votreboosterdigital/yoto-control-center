import type { YotoProvider } from './provider'
import type { Device, PlaybackState, YotoEvent } from './types'

type PlaybackStatus = 'idle' | 'playing' | 'paused'

interface DeviceState {
  volume: number
  playbackStatus: PlaybackStatus
  contentId?: string
  trackTitle?: string
  positionSeconds: number
}

const MOCK_DEVICES: Device[] = [
  {
    id: 'mock-player-1',
    name: 'Yoto de Sofia',
    type: 'player',
    online: true,
    volume: 60,
    batteryLevel: 85,
    lastSeenAt: new Date(),
  },
  {
    id: 'mock-mini-1',
    name: 'Yoto Mini Chambre',
    type: 'mini',
    online: true,
    volume: 40,
    batteryLevel: 100,
    lastSeenAt: new Date(),
  },
]

// Cycle rotatif : idle → playing → paused → idle
const STATUS_CYCLE: PlaybackStatus[] = ['idle', 'playing', 'paused']

export class MockYotoProvider implements YotoProvider {
  private state = new Map<string, DeviceState>()
  private statusCycleIndex = new Map<string, number>()

  constructor() {
    for (const device of MOCK_DEVICES) {
      this.state.set(device.id, {
        volume: device.volume,
        playbackStatus: 'idle',
        positionSeconds: 0,
      })
      this.statusCycleIndex.set(device.id, 0)
    }
  }

  async authenticate(): Promise<void> {
    // Mode mock — pas d'authentification réelle
  }

  async listDevices(): Promise<Device[]> {
    return MOCK_DEVICES.map((device) => {
      const st = this.state.get(device.id)
      return {
        ...device,
        volume: st?.volume ?? device.volume,
        lastSeenAt: new Date(),
        currentPlayback: this._buildPlayback(device.id),
      }
    })
  }

  async getDevice(deviceId: string): Promise<Device> {
    const device = MOCK_DEVICES.find((d) => d.id === deviceId)
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`)
    }
    const st = this.state.get(deviceId)
    return {
      ...device,
      volume: st?.volume ?? device.volume,
      lastSeenAt: new Date(),
      currentPlayback: this._buildPlayback(deviceId),
    }
  }

  async getPlaybackState(deviceId: string): Promise<PlaybackState> {
    const device = MOCK_DEVICES.find((d) => d.id === deviceId)
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`)
    }

    // Avancer dans le cycle rotatif à chaque appel
    const currentIndex = this.statusCycleIndex.get(deviceId) ?? 0
    const nextIndex = (currentIndex + 1) % STATUS_CYCLE.length
    this.statusCycleIndex.set(deviceId, nextIndex)

    const st = this.state.get(deviceId)!
    const newStatus = STATUS_CYCLE[nextIndex]
    st.playbackStatus = newStatus

    if (newStatus === 'playing') {
      st.contentId = 'mock-card-paddington-123'
      st.trackTitle = 'Paddington Bear - Chapitre 1'
      st.positionSeconds = 42
    }

    return this._buildPlayback(deviceId)
  }

  async setVolume(deviceId: string, volume: number): Promise<void> {
    if (volume < 0 || volume > 100) {
      throw new Error(`Volume invalide : ${volume}. Doit être entre 0 et 100.`)
    }
    const st = this.state.get(deviceId)
    if (!st) throw new Error(`Device not found: ${deviceId}`)
    st.volume = volume
  }

  async pause(deviceId: string): Promise<void> {
    const st = this.state.get(deviceId)
    if (!st) throw new Error(`Device not found: ${deviceId}`)
    st.playbackStatus = 'paused'
  }

  async resume(deviceId: string): Promise<void> {
    const st = this.state.get(deviceId)
    if (!st) throw new Error(`Device not found: ${deviceId}`)
    st.playbackStatus = 'playing'
  }

  async playPlaylist(deviceId: string, playlistId: string): Promise<void> {
    const st = this.state.get(deviceId)
    if (!st) throw new Error(`Device not found: ${deviceId}`)
    st.playbackStatus = 'playing'
    st.contentId = playlistId
    st.trackTitle = `Playlist : ${playlistId}`
    st.positionSeconds = 0
  }

  async playStream(deviceId: string, streamUrl: string): Promise<void> {
    const st = this.state.get(deviceId)
    if (!st) throw new Error(`Device not found: ${deviceId}`)
    st.playbackStatus = 'playing'
    st.contentId = streamUrl
    st.trackTitle = `Stream : ${streamUrl}`
    st.positionSeconds = 0
  }

  async displayPreview(deviceId: string, uri: string, timeoutSeconds: number, animated = false): Promise<void> {
    const st = this.state.get(deviceId)
    if (!st) throw new Error(`Device not found: ${deviceId}`)
    // Mode mock — log uniquement
    console.log(`[mock] displayPreview ${deviceId}: ${uri} (${timeoutSeconds}s, animated=${animated})`)
  }

  async subscribeToEvents(
    onEvent: (event: YotoEvent) => void,
  ): Promise<() => Promise<void>> {
    // Émet des événements simulés toutes les 5 secondes
    const interval = setInterval(() => {
      const deviceIds = Array.from(this.state.keys())

      for (const deviceId of deviceIds) {
        const st = this.state.get(deviceId)!

        // Alterner entre track_changed et volume.changed
        const eventType = Math.random() > 0.5
          ? 'playback.track_changed'
          : 'volume.changed'

        if (eventType === 'playback.track_changed') {
          onEvent({
            type: 'playback.track_changed',
            deviceId,
            payload: {
              trackTitle: 'Paddington Bear - Chapitre 2',
              cardId: 'mock-card-paddington-123',
              playbackStatus: st.playbackStatus,
            },
            timestamp: new Date(),
          })
        } else {
          onEvent({
            type: 'volume.changed',
            deviceId,
            payload: {
              volume: st.volume,
            },
            timestamp: new Date(),
          })
        }
      }
    }, 5000)

    return async () => {
      clearInterval(interval)
    }
  }

  // ─── Helpers privés ─────────────────────────────────────────────────────────

  private _buildPlayback(deviceId: string): PlaybackState {
    const st = this.state.get(deviceId)
    if (!st) {
      return { deviceId, status: 'offline', updatedAt: new Date() }
    }

    return {
      deviceId,
      status: st.playbackStatus,
      contentId: st.contentId,
      contentType: st.contentId ? 'card' : undefined,
      trackTitle: st.trackTitle,
      positionSeconds: st.positionSeconds,
      updatedAt: new Date(),
    }
  }
}
