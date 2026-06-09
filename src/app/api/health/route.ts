import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.APP_ENV ?? 'development',
    mockMode: process.env.ENABLE_MOCK_PROVIDER === 'true',
  })
}
