import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { ScenarioStep } from '@/lib/scenarios/types'

// --- Mocks ---

const mockScenarioRunCreate = vi.fn()
const mockScenarioRunUpdate = vi.fn()
const mockScenarioFindUnique = vi.fn()

vi.mock('@/lib/prisma', () => ({
  prisma: {
    scenario: {
      findUnique: mockScenarioFindUnique,
    },
    scenarioRun: {
      create: mockScenarioRunCreate,
      update: mockScenarioRunUpdate,
    },
  },
}))

const mockSetVolume = vi.fn().mockResolvedValue(undefined)
const mockPlayPlaylist = vi.fn().mockResolvedValue(undefined)
const mockPlayStream = vi.fn().mockResolvedValue(undefined)
const mockPause = vi.fn().mockResolvedValue(undefined)
const mockResume = vi.fn().mockResolvedValue(undefined)

const mockProvider = {
  authenticate: vi.fn(),
  listDevices: vi.fn(),
  getDevice: vi.fn(),
  getPlaybackState: vi.fn(),
  playPlaylist: mockPlayPlaylist,
  playStream: mockPlayStream,
  pause: mockPause,
  resume: mockResume,
  setVolume: mockSetVolume,
  subscribeToEvents: vi.fn(),
}

vi.mock('@/lib/yoto', () => ({
  getProvider: vi.fn(() => mockProvider),
  resetProvider: vi.fn(),
}))

vi.mock('@/lib/events/bus', () => ({
  eventBus: {
    emit: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Import après les mocks
const { ScenarioRunner } = await import('@/server/services/ScenarioRunner')

// --- Helpers ---

const makeScenario = (steps: ScenarioStep[], overrides: Record<string, unknown> = {}) => ({
  id: 'scenario-1',
  slug: 'test-scenario',
  name: 'Test Scenario',
  description: 'Scénario de test',
  enabled: true,
  steps: JSON.stringify(steps),
  trigger: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

const makeRun = (id = 'run-1') => ({
  id,
  scenarioId: 'scenario-1',
  deviceId: 'device-1',
  status: 'running',
  startedAt: new Date(),
  finishedAt: null,
  error: null,
  log: null,
})

const baseSteps: ScenarioStep[] = [
  { id: 's1', type: 'set_volume', order: 1, params: { volume: 50 } },
  { id: 's2', type: 'play_playlist', order: 2, params: { playlistId: 'playlist-test' } },
]

// --- Tests ---

describe('ScenarioRunner.run()', () => {
  let runner: InstanceType<typeof ScenarioRunner>

  beforeEach(() => {
    vi.clearAllMocks()
    runner = new ScenarioRunner()
  })

  it('lance tous les steps dans l\'ordre', async () => {
    mockScenarioFindUnique.mockResolvedValue(makeScenario(baseSteps))
    mockScenarioRunCreate.mockResolvedValue(makeRun())
    mockScenarioRunUpdate.mockResolvedValue({})

    await runner.run('scenario-1', 'device-1')

    expect(mockSetVolume).toHaveBeenCalledWith('device-1', 50)
    expect(mockPlayPlaylist).toHaveBeenCalledWith('device-1', 'playlist-test')
  })

  it('retourne l\'id du run créé', async () => {
    mockScenarioFindUnique.mockResolvedValue(makeScenario(baseSteps))
    mockScenarioRunCreate.mockResolvedValue(makeRun('run-abc'))
    mockScenarioRunUpdate.mockResolvedValue({})

    const runId = await runner.run('scenario-1', 'device-1')

    expect(runId).toBe('run-abc')
  })

  it('met le status à "completed" après exécution réussie', async () => {
    mockScenarioFindUnique.mockResolvedValue(makeScenario(baseSteps))
    mockScenarioRunCreate.mockResolvedValue(makeRun())
    mockScenarioRunUpdate.mockResolvedValue({})

    await runner.run('scenario-1', 'device-1')

    expect(mockScenarioRunUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'completed' }),
      }),
    )
  })

  it('un step qui échoue n\'arrête pas l\'exécution — les autres steps s\'exécutent', async () => {
    const stepsWithFailure: ScenarioStep[] = [
      { id: 's1', type: 'set_volume', order: 1, params: { volume: 50 } },
      { id: 's2', type: 'set_volume', order: 2, params: { volume: 'invalid' as unknown as number } }, // step qui va échouer
      { id: 's3', type: 'play_playlist', order: 3, params: { playlistId: 'playlist-ok' } },
    ]

    mockScenarioFindUnique.mockResolvedValue(makeScenario(stepsWithFailure))
    mockScenarioRunCreate.mockResolvedValue(makeRun())
    mockScenarioRunUpdate.mockResolvedValue({})

    await runner.run('scenario-1', 'device-1')

    // Step 1 et step 3 doivent avoir été appelés malgré l'échec de step 2
    expect(mockSetVolume).toHaveBeenCalledWith('device-1', 50)
    expect(mockPlayPlaylist).toHaveBeenCalledWith('device-1', 'playlist-ok')
    // Status final reste "completed" même avec un step en échec
    expect(mockScenarioRunUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'completed' }),
      }),
    )
  })

  it('le log contient les statuts de chaque step', async () => {
    mockScenarioFindUnique.mockResolvedValue(makeScenario(baseSteps))
    mockScenarioRunCreate.mockResolvedValue(makeRun())
    mockScenarioRunUpdate.mockResolvedValue({})

    await runner.run('scenario-1', 'device-1')

    const updateCall = mockScenarioRunUpdate.mock.calls[0]
    const logData = JSON.parse(updateCall[0].data.log as string) as Array<{
      step: number
      type: string
      status: string
    }>

    expect(logData).toHaveLength(2)
    expect(logData[0]).toMatchObject({ step: 1, type: 'set_volume', status: 'ok' })
    expect(logData[1]).toMatchObject({ step: 2, type: 'play_playlist', status: 'ok' })
  })

  it('lance une erreur si le scénario n\'existe pas', async () => {
    mockScenarioFindUnique.mockResolvedValue(null)

    await expect(runner.run('nonexistent', 'device-1')).rejects.toThrow('Scenario nonexistent not found')
  })

  it('lance une erreur si le scénario est désactivé', async () => {
    mockScenarioFindUnique.mockResolvedValue(makeScenario(baseSteps, { enabled: false }))

    await expect(runner.run('scenario-1', 'device-1')).rejects.toThrow('Scenario scenario-1 is disabled')
  })
})
