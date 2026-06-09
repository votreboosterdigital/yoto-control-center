import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getProvider } from '@/lib/yoto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const volumeSchema = z.object({
  volume: z.number().min(0).max(100),
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

  const parsed = volumeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { volume } = parsed.data

  try {
    const provider = getProvider()
    await provider.setVolume(deviceId, volume)

    await prisma.deviceSnapshot.upsert({
      where: { deviceId },
      create: {
        deviceId,
        data: { volume, updatedAt: new Date().toISOString() },
      },
      update: {
        data: { volume, updatedAt: new Date().toISOString() },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error, deviceId, volume }, 'POST /api/devices/[deviceId]/volume failed')
    return NextResponse.json({ error: 'Échec du changement de volume' }, { status: 500 })
  }
}
