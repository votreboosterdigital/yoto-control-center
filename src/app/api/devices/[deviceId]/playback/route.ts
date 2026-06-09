import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/yoto'
import { logger } from '@/lib/logger'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  const { deviceId } = await params
  try {
    const provider = getProvider()
    const playback = await provider.getPlaybackState(deviceId)
    return NextResponse.json({ playback })
  } catch (error) {
    logger.error({ error, deviceId }, 'GET /api/devices/[deviceId]/playback failed')
    return NextResponse.json(
      { error: 'Failed to get playback state' },
      { status: 500 },
    )
  }
}
