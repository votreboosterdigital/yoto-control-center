import { NextResponse } from 'next/server'
import { YotoClient, DEFAULT_CLIENT_ID } from 'yoto-nodejs-client'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ deviceId: string }> }

export async function GET(_req: Request, { params }: RouteContext) {
  const { deviceId } = await params
  try {
    const client = new YotoClient({
      clientId: process.env.YOTO_CLIENT_ID ?? DEFAULT_CLIENT_ID,
      refreshToken: process.env.YOTO_REFRESH_TOKEN ?? '',
      accessToken: process.env.YOTO_ACCESS_TOKEN ?? '',
      onTokenRefresh: () => {},
    })
    const status = await client.getDeviceStatus({ deviceId })
    return NextResponse.json({ status })
  } catch (error) {
    logger.warn({ error, deviceId }, 'GET /api/devices/[deviceId]/status failed')
    return NextResponse.json({ status: null })
  }
}
