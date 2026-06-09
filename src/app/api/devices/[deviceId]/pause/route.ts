import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/yoto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params

  try {
    const provider = getProvider()
    await provider.pause(deviceId)

    await prisma.deviceSnapshot.upsert({
      where: { deviceId },
      create: {
        deviceId,
        data: { playback: { status: 'paused', updatedAt: new Date().toISOString() } },
      },
      update: {
        data: { playback: { status: 'paused', updatedAt: new Date().toISOString() } },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error, deviceId }, 'POST /api/devices/[deviceId]/pause failed')
    return NextResponse.json({ error: 'Échec de la mise en pause' }, { status: 500 })
  }
}
