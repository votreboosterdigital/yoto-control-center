import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import Database from 'better-sqlite3'
import path from 'node:path'
import type { ScenarioStep } from '../src/lib/scenarios/types'

const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
const dbPath = dbUrl.replace(/^file:/, '')
const resolvedPath = path.isAbsolute(dbPath)
  ? dbPath
  : path.join(process.cwd(), dbPath)

const sqlite = new Database(resolvedPath)
const adapter = new PrismaBetterSqlite3({ url: resolvedPath })
const prisma = new PrismaClient({ adapter })

// --- Super Papa Mode ---
const superPapaSteps: ScenarioStep[] = [
  { id: 'spm-1', type: 'set_volume', order: 1, params: { volume: 60 } },
  { id: 'spm-2', type: 'play_stream', order: 2, params: { streamUrl: 'https://example.com/bonjour.mp3', text: 'Bonjour ma chérie !' } },
  { id: 'spm-3', type: 'wait', order: 3, params: { durationSeconds: 2 } },
  { id: 'spm-4', type: 'play_playlist', order: 4, params: { playlistId: 'playlist-matin' } },
]

// --- Mission Secrète ---
const missionSecreteSteps: ScenarioStep[] = [
  { id: 'ms-1', type: 'set_volume', order: 1, params: { volume: 70 } },
  { id: 'ms-2', type: 'play_stream', order: 2, params: { streamUrl: 'https://example.com/mission-intro.mp3', text: 'Agent, ta mission commence...' } },
  { id: 'ms-3', type: 'wait', order: 3, params: { durationSeconds: 1 } },
  { id: 'ms-4', type: 'play_playlist', order: 4, params: { playlistId: 'playlist-aventure' } },
  { id: 'ms-5', type: 'wait', order: 5, params: { durationSeconds: 5 } },
]

// --- Routine Dodo ---
const routineDodoSteps: ScenarioStep[] = [
  { id: 'rd-1', type: 'set_volume', order: 1, params: { volume: 30 } },
  { id: 'rd-2', type: 'play_playlist', order: 2, params: { playlistId: 'playlist-histoire' } },
  { id: 'rd-3', type: 'wait', order: 3, params: { durationSeconds: 10 } },
  { id: 'rd-4', type: 'play_playlist', order: 4, params: { playlistId: 'playlist-bruit-blanc' } },
  { id: 'rd-5', type: 'assign_icon', order: 5, params: { iconKey: 'moon' } },
]

async function main() {
  await prisma.scenario.upsert({
    where: { slug: 'super-papa-mode' },
    create: {
      slug: 'super-papa-mode',
      name: 'Super Papa Mode',
      description: 'Impressionne ton enfant avec une séquence personnalisée',
      enabled: true,
      steps: JSON.stringify(superPapaSteps),
    },
    update: { steps: JSON.stringify(superPapaSteps) },
  })
  console.log('✅ Scénario "Super Papa Mode" upserted')

  await prisma.scenario.upsert({
    where: { slug: 'mission-secrete' },
    create: {
      slug: 'mission-secrete',
      name: 'Mission Secrète',
      description: "Lance une mission audio mystérieuse pour l'enfant",
      enabled: true,
      steps: JSON.stringify(missionSecreteSteps),
    },
    update: { steps: JSON.stringify(missionSecreteSteps) },
  })
  console.log('✅ Scénario "Mission Secrète" upserted')

  await prisma.scenario.upsert({
    where: { slug: 'routine-dodo' },
    create: {
      slug: 'routine-dodo',
      name: 'Routine Dodo',
      description: 'Prépare l\'enfant au sommeil avec douceur',
      enabled: true,
      steps: JSON.stringify(routineDodoSteps),
    },
    update: { steps: JSON.stringify(routineDodoSteps) },
  })
  console.log('✅ Scénario "Routine Dodo" upserted')

  // Schedule démo : routine dodo tous les soirs à 20h30 (Montréal)
  const routineDodo = await prisma.scenario.findUnique({ where: { slug: 'routine-dodo' } })
  if (routineDodo) {
    await prisma.schedule.upsert({
      where: { id: 'schedule-dodo-demo' },
      create: {
        id: 'schedule-dodo-demo',
        scenarioId: routineDodo.id,
        cron: '30 20 * * *',
        timezone: 'America/Montreal',
        enabled: true,
        deviceId: 'mock-player-1',
      },
      update: {},
    })
    console.log('✅ Schedule démo "Routine Dodo 20h30" upserted')
  }

  // --- AudioAssets de démo ---
  const audioAssets = [
    {
      name: 'Message bonjour',
      url: 'https://example.com/bonjour.mp3',
      type: 'message',
      duration: null,
      tags: '["matin","réveil"]',
    },
    {
      name: 'Bruit blanc',
      url: 'https://example.com/white-noise.mp3',
      type: 'music',
      duration: 3600,
      tags: '["sommeil","calme"]',
    },
    {
      name: 'Mission intro',
      url: 'https://example.com/mission.mp3',
      type: 'sfx',
      duration: null,
      tags: '["aventure","mission"]',
    },
  ]

  for (const asset of audioAssets) {
    const id = `asset-${asset.name.toLowerCase().replace(/\s/g, '-')}`
    await prisma.audioAsset.upsert({
      where: { id },
      create: { id, ...asset },
      update: {},
    })
    console.log(`✅ AudioAsset "${asset.name}" upserted`)
  }

  console.log('✅ Seed terminé')
}

main()
  .catch(console.error)
  .finally(() => {
    prisma.$disconnect()
    sqlite.close()
  })
