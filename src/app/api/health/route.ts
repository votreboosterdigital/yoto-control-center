import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/yoto'

export async function GET() {
  let providerStatus = 'unknown'
  try {
    const provider = getProvider()
    await provider.listDevices()
    providerStatus = 'ok'
  } catch {
    providerStatus = 'error'
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.APP_ENV ?? 'development',
    mockMode: process.env.ENABLE_MOCK_PROVIDER === 'true',
    provider: providerStatus,
  })
}
