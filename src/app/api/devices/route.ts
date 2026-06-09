import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/yoto'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    const provider = getProvider()
    const devices = await provider.listDevices()
    return NextResponse.json({ devices })
  } catch (error) {
    logger.error({ error }, 'GET /api/devices failed')
    return NextResponse.json(
      { error: 'Failed to list devices' },
      { status: 500 },
    )
  }
}
