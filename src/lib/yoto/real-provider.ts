import type { YotoProvider } from './provider'
import type { Device, PlaybackState, YotoEvent } from './types'
import { logger } from '@/lib/logger'
import { YotoClient, YotoDeviceModel, DEFAULT_CLIENT_ID } from 'yoto-nodejs-client'

interface RealYotoProviderOptions {
  refreshToken: string
  accessToken: string
  clientId?: string
}

export class RealYotoProvider implements YotoProvider {
  private client: YotoClient
  private deviceModels = new Map<string, YotoDeviceModel>()
  private authenticated = false

  constructor({ refreshToken, accessToken, clientId }: RealYotoProviderOptions) {
    this.client = new YotoClient({
      clientId: clientId ?? DEFAULT_CLIENT_ID,
      refreshToken,
      accessToken,
      onTokenRefresh: async ({ updatedAccessToken, updatedRefreshToken }) => {
        // TODO: persister les tokens en DB ou fichier chiffré pour éviter
        // d'avoir à ré-authentifier au redémarrage du serveur
        logger.info(
          { accessTokenLength: updatedAccessToken.length },
          'Tokens Yoto rafraîchis — à persister',
        )
        // En production, écrire dans process.env ou une DB sécurisée :
        // process.env.YOTO_ACCESS_TOKEN = updatedAccessToken
        // process.env.YOTO_REFRESH_TOKEN = updatedRefreshToken
        void updatedRefreshToken // référencé pour éviter unused-var
      },
      onRefreshError: (error) => {
        logger.warn({ error }, 'Erreur transitoire de refresh token Yoto')
      },
      onInvalid: (error) => {
        logger.error({ error }, 'Refresh token Yoto invalide — ré-authentification requise')
      },
      userAgent: 'yoto-control-center/1.0.0',
    })
  }

  async authenticate(): Promise<void> {
    try {
      // Vérifier que le client peut lister les devices (valide le token)
      await this.client.getDevices()
      this.authenticated = true
      logger.info('RealYotoProvider authentifié avec succès')
    } catch (error) {
      logger.error({ error }, 'RealYotoProvider.authenticate — échec')
      throw error
    }
  }

  async listDevices(): Promise<Device[]> {
    const { devices } = await this.client.getDevices()

    return devices.map((d) => this._mapDevice(d))
  }

  async getDevice(deviceId: string): Promise<Device> {
    const devices = await this.listDevices()
    const device = devices.find((d) => d.id === deviceId)
    if (!device) {
      throw new Error(`Device not found: ${deviceId}`)
    }
    return device
  }

  async getPlaybackState(deviceId: string): Promise<PlaybackState> {
    // Utiliser le YotoDeviceModel stateful si disponible (connecté MQTT)
    const model = this.deviceModels.get(deviceId)
    if (model) {
      return this._mapPlaybackFromModel(deviceId, model)
    }

    // Fallback : statut HTTP
    // TODO: vérifier avec device réel — getDeviceStatus retourne-t-il playbackStatus ?
    const status = await this.client.getDeviceStatus({ deviceId })

    const playbackStatus = status.isOnline
      ? (status.activeCard && status.activeCard !== 'none' ? 'playing' : 'idle')
      : 'offline'

    return {
      deviceId,
      status: playbackStatus as PlaybackState['status'],
      contentId: status.activeCard !== 'none' ? status.activeCard : undefined,
      updatedAt: new Date(status.updatedAt),
    }
  }

  async setVolume(deviceId: string, volume: number): Promise<void> {
    if (volume < 0 || volume > 100) {
      throw new Error(`Volume invalide : ${volume}. Doit être entre 0 et 100.`)
    }
    const model = await this.getOrCreateModel(deviceId)
    const hardwareVolume = Math.round(volume * 16 / 100)
    logger.info({ deviceId, volume, hardwareVolume, mqttConnected: model.mqttConnected }, 'setVolume MQTT')
    await model.setVolume(hardwareVolume)
  }

  async pause(deviceId: string): Promise<void> {
    const model = await this.getOrCreateModel(deviceId)
    logger.info({ deviceId, mqttConnected: model.mqttConnected }, 'pause MQTT')
    await model.pauseCard()
  }

  async resume(deviceId: string): Promise<void> {
    const model = await this.getOrCreateModel(deviceId)
    logger.info({ deviceId, mqttConnected: model.mqttConnected }, 'resume MQTT')
    await model.resumeCard()
  }

  async playPlaylist(deviceId: string, playlistId: string): Promise<void> {
    const model = await this.getOrCreateModel(deviceId)
    logger.info({ deviceId, playlistId, mqttConnected: model.mqttConnected }, 'startCard MQTT')
    await model.startCard({ cardId: playlistId })
  }

  async playStream(deviceId: string, streamUrl: string): Promise<void> {
    const model = await this.getOrCreateModel(deviceId)
    logger.info({ deviceId, streamUrl, mqttConnected: model.mqttConnected }, 'startCard (stream) MQTT')
    await model.startCard({ cardId: streamUrl })
  }

  async subscribeToEvents(
    onEvent: (event: YotoEvent) => void,
  ): Promise<() => Promise<void>> {
    const { devices: rawDevices } = await this.client.getDevices()
    const cleanupFns: Array<() => void> = []

    for (const rawDevice of rawDevices) {
      const deviceId = rawDevice.deviceId

      // Créer ou réutiliser le YotoDeviceModel
      let model = this.deviceModels.get(deviceId)
      if (!model) {
        model = new YotoDeviceModel(this.client, rawDevice, {
          httpPollIntervalMs: 600_000, // polling toutes les 10 minutes
        })
        this.deviceModels.set(deviceId, model)
      }

      // Écouter les mises à jour de statut
      const onStatusUpdate = () => {
        onEvent({
          type: 'device.connected',
          deviceId,
          payload: { isOnline: model!.status.isOnline },
          timestamp: new Date(),
        })
      }

      // Écouter les mises à jour de playback
      const onPlaybackUpdate = () => {
        const pb = model!.playback
        onEvent({
          type: 'playback.track_changed',
          deviceId,
          payload: {
            trackTitle: pb.trackTitle,
            cardId: pb.cardId,
            playbackStatus: pb.playbackStatus,
            position: pb.position,
          },
          timestamp: new Date(),
        })
      }

      // Écouter online/offline
      const onOnline = () => {
        onEvent({
          type: 'device.connected',
          deviceId,
          payload: { reason: 'online' },
          timestamp: new Date(),
        })
      }

      const onOffline = () => {
        onEvent({
          type: 'device.disconnected',
          deviceId,
          payload: { reason: 'offline' },
          timestamp: new Date(),
        })
      }

      model.on('statusUpdate', onStatusUpdate)
      model.on('playbackUpdate', onPlaybackUpdate)
      model.on('online', onOnline)
      model.on('offline', onOffline)

      // Démarrer le device client (MQTT + polling)
      await model.start()

      cleanupFns.push(() => {
        model!.off('statusUpdate', onStatusUpdate)
        model!.off('playbackUpdate', onPlaybackUpdate)
        model!.off('online', onOnline)
        model!.off('offline', onOffline)
      })
    }

    return async () => {
      for (const fn of cleanupFns) fn()
      for (const model of this.deviceModels.values()) {
        await model.stop()
      }
      this.deviceModels.clear()
    }
  }

  // ─── Helpers privés ─────────────────────────────────────────────────────────

  private async getOrCreateModel(deviceId: string): Promise<YotoDeviceModel> {
    let model = this.deviceModels.get(deviceId)

    if (!model) {
      logger.warn({ deviceId, knownDevices: Array.from(this.deviceModels.keys()) }, 'Modèle absent — création lazy')
      // Stub minimal : model.start() fetche les vraies données (name, online...) via HTTP
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stub = { deviceId, name: '', description: '', online: false } as any
      model = new YotoDeviceModel(this.client, stub, { httpPollIntervalMs: 600_000 })
      this.deviceModels.set(deviceId, model)
    }

    if (!model.running) {
      logger.warn({ deviceId }, 'Modèle non démarré — démarrage MQTT')
      await model.start()
    }

    return model
  }

  private _mapDevice(d: {
    deviceId: string
    name: string
    online: boolean
    formFactor?: string
    deviceType?: string
    deviceFamily?: string
  }): Device {
    // Déterminer le type : 'mini' si formFactor ou deviceType contient 'mini'
    const rawType = (d.formFactor ?? d.deviceType ?? '').toLowerCase()
    const type: Device['type'] = rawType.includes('mini') ? 'mini' : 'player'

    return {
      id: d.deviceId,
      name: d.name,
      type,
      online: d.online,
      volume: 50, // volume inconnu sans appel status séparé
      lastSeenAt: new Date(),
    }
  }

  private _mapPlaybackFromModel(
    deviceId: string,
    model: YotoDeviceModel,
  ): PlaybackState {
    const pb = model.playback
    const playbackStatus = pb.playbackStatus

    let status: PlaybackState['status'] = 'idle'
    if (playbackStatus === 'playing') status = 'playing'
    else if (playbackStatus === 'paused') status = 'paused'
    else if (playbackStatus === 'stopped' || playbackStatus === null) status = 'idle'

    return {
      deviceId,
      status,
      contentId: pb.cardId ?? undefined,
      contentType: pb.cardId ? 'card' : undefined,
      trackTitle: pb.trackTitle ?? undefined,
      positionSeconds: pb.position ?? undefined,
      updatedAt: new Date(pb.updatedAt),
    }
  }
}
