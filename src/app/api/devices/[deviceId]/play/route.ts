import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getProvider } from '@/lib/yoto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const playSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('playlist'), id: z.string().min(1) }),
  z.object({ type: z.literal('stream'), url: z.string().url() }),
])

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params

  if (!deviceId || !/^[a-zA-Z0-9_-]{1,64}$/.test(deviceId)) {
    return NextResponse.json({ error: 'deviceId invalide' }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 })
  }

  const parsed = playSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const data = parsed.data

  try {
    const provider = getProvider()

    if (data.type === 'playlist') {
      await provider.playPlaylist(deviceId, data.id)
    } else {
      await provider.playStream(deviceId, data.url)
    }

    const contentId = data.type === 'playlist' ? data.id : data.url
    await prisma.deviceSnapshot.upsert({
      where: { deviceId },
      create: {
        deviceId,
        data: { playback: { status: 'playing', contentType: data.type, contentId, updatedAt: new Date().toISOString() } },
      },
      update: {
        data: { playback: { status: 'playing', contentType: data.type, contentId, updatedAt: new Date().toISOString() } },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error, deviceId }, 'POST /api/devices/[deviceId]/play failed')
    return NextResponse.json({ error: 'Échec du lancement de la lecture' }, { status: 500 })
  }
}
