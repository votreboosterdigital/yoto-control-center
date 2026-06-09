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
    const device = await provider.getDevice(deviceId)
    return NextResponse.json({ device })
  } catch (error) {
    const isNotFound = error instanceof Error && error.message.toLowerCase().includes('not found')
    logger.error({ error, deviceId }, 'GET /api/devices/[deviceId] failed')
    return NextResponse.json(
      { error: isNotFound ? 'Device not found' : 'Failed to get device' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}
