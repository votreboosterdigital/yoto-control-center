import { prisma } from '@/lib/prisma'
import { getProvider } from '@/lib/yoto'
import { eventBus } from '@/lib/events/bus'
import { logger } from '@/lib/logger'
import type { ScenarioStep } from '@/lib/scenarios/types'

export class ScenarioRunner {
  async run(scenarioId: string, deviceId: string): Promise<string> {
    const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } })
    if (!scenario) throw new Error(`Scenario ${scenarioId} not found`)
    if (!scenario.enabled) throw new Error(`Scenario ${scenarioId} is disabled`)

    const run = await prisma.scenarioRun.create({
      data: { scenarioId, deviceId, status: 'running' },
    })

    await eventBus.emit({
      type: 'scenario.started',
      deviceId,
      payload: { scenarioId, runId: run.id },
      timestamp: new Date(),
    })

    // SQLite retourne les champs Json comme string — désérialiser si nécessaire
    const stepsRaw = scenario.steps
    const steps: ScenarioStep[] =
      typeof stepsRaw === 'string'
        ? (JSON.parse(stepsRaw) as ScenarioStep[])
        : (stepsRaw as unknown as ScenarioStep[])

    const provider = getProvider()
    const stepLog: Array<{ step: number; type: string; status: string; error?: string }> = []

    try {
      for (const step of steps) {
        try {
          await this.executeStep(step, deviceId, provider)
          stepLog.push({ step: step.order, type: step.type, status: 'ok' })

          await eventBus.emit({
            type: 'scenario.step_completed',
            deviceId,
            payload: { scenarioId, runId: run.id, stepType: step.type },
            timestamp: new Date(),
          })
        } catch (stepError) {
          const message = stepError instanceof Error ? stepError.message : 'Unknown error'
          stepLog.push({ step: step.order, type: step.type, status: 'failed', error: message })
          logger.warn({ step, error: stepError }, 'Étape échouée — on continue')
        }
      }

      await prisma.scenarioRun.update({
        where: { id: run.id },
        data: {
          status: 'completed',
          finishedAt: new Date(),
          log: JSON.stringify(stepLog),
        },
      })

      return run.id
    } catch (error) {
      await prisma.scenarioRun.update({
        where: { id: run.id },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown',
          log: JSON.stringify(stepLog),
        },
      })

      await eventBus.emit({
        type: 'scenario.failed',
        deviceId,
        payload: { scenarioId, runId: run.id },
        timestamp: new Date(),
      })

      throw error
    }
  }

  private async executeStep(
    step: ScenarioStep,
    deviceId: string,
    provider: ReturnType<typeof getProvider>
  ): Promise<void> {
    switch (step.type) {
      case 'set_volume': {
        const volume = step.params['volume']
        if (typeof volume !== 'number') throw new Error('set_volume: params.volume must be a number')
        await provider.setVolume(deviceId, volume)
        break
      }
      case 'play_playlist': {
        const playlistId = step.params['playlistId']
        if (typeof playlistId !== 'string') throw new Error('play_playlist: params.playlistId must be a string')
        await provider.playPlaylist(deviceId, playlistId)
        break
      }
      case 'play_stream': {
        const streamUrl = step.params['streamUrl']
        if (typeof streamUrl !== 'string') throw new Error('play_stream: params.streamUrl must be a string')
        await provider.playStream(deviceId, streamUrl)
        break
      }
      case 'pause':
        await provider.pause(deviceId)
        break
      case 'resume':
        await provider.resume(deviceId)
        break
      case 'wait': {
        const durationSeconds = step.params['durationSeconds']
        if (typeof durationSeconds !== 'number') throw new Error('wait: params.durationSeconds must be a number')
        await new Promise<void>((resolve) => setTimeout(resolve, durationSeconds * 1000))
        break
      }
      case 'assign_icon': {
        const iconKey = step.params['iconKey']
        logger.info({ deviceId, iconKey }, 'assign_icon (non implémenté en v1)')
        break
      }
      default: {
        const _exhaustive: never = step.type
        logger.warn({ stepType: _exhaustive }, 'Type d\'étape inconnu')
      }
    }
  }
}

export const scenarioRunner = new ScenarioRunner()
