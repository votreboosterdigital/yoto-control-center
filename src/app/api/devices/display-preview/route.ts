import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getProvider } from '@/lib/yoto'
import { logger } from '@/lib/logger'

const Schema = z.object({
  deviceId: z.string().min(1),
  uri: z.string().url('URI doit être une URL valide'),
  timeoutSeconds: z.number().int().min(1).max(60).default(10),
  animated: z.boolean().default(false),
})

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = Schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Données invalides' }, { status: 400 })
    }

    const { deviceId, uri, timeoutSeconds, animated } = parsed.data
    const provider = getProvider()
    await provider.displayPreview(deviceId, uri, timeoutSeconds, animated)

    logger.info({ deviceId, uri, timeoutSeconds }, 'displayPreview envoyé')
    return NextResponse.json({ ok: true })
  } catch (error) {
    logger.error({ error }, 'POST /api/devices/display-preview failed')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}
