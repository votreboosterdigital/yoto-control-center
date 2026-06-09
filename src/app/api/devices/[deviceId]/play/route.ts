import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getProvider } from '@/lib/yoto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const playSchema = z.object({
  type: z.enum(['playlist', 'stream']),
  id: z.string().optional(),
  url: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params

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

  const { type, id, url } = parsed.data

  if (type === 'playlist' && !id) {
    return NextResponse.json({ error: 'id est requis pour le type playlist' }, { status: 400 })
  }
  if (type === 'stream' && !url) {
    return NextResponse.json({ error: 'url est requise pour le type stream' }, { status: 400 })
  }

  try {
    const provider = getProvider()

    if (type === 'playlist') {
      await provider.playPlaylist(deviceId, id!)
    } else {
      await provider.playStream(deviceId, url!)
    }

    await prisma.deviceSnapshot.upsert({
      where: { deviceId },
      create: {
        deviceId,
        data: { playback: { status: 'playing', contentType: type, contentId: id ?? url, updatedAt: new Date().toISOString() } },
      },
      update: {
        data: { playback: { status: 'playing', contentType: type, contentId: id ?? url, updatedAt: new Date().toISOString() } },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error, deviceId }, 'POST /api/devices/[deviceId]/play failed')
    return NextResponse.json({ error: 'Échec du lancement de la lecture' }, { status: 500 })
  }
}
