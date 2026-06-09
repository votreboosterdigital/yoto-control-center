import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/yoto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params

  if (!deviceId || !/^[a-zA-Z0-9_-]{1,64}$/.test(deviceId)) {
    return NextResponse.json({ error: 'deviceId invalide' }, { status: 400 })
  }

  try {
    const provider = getProvider()
    await provider.resume(deviceId)

    await prisma.deviceSnapshot.upsert({
      where: { deviceId },
      create: {
        deviceId,
        data: { playback: { status: 'playing', updatedAt: new Date().toISOString() } },
      },
      update: {
        data: { playback: { status: 'playing', updatedAt: new Date().toISOString() } },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error, deviceId }, 'POST /api/devices/[deviceId]/resume failed')
    return NextResponse.json({ error: 'Échec de la reprise de lecture' }, { status: 500 })
  }
}
