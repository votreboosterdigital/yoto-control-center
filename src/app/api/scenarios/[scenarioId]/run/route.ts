import { NextResponse } from 'next/server'
import { z } from 'zod'
import { scenarioRunner } from '@/server/services/ScenarioRunner'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ scenarioId: string }> }

const RunSchema = z.object({
  deviceId: z.string().min(1),
  runtimeParams: z.record(z.string(), z.unknown()).optional(),
})

// POST /api/scenarios/[scenarioId]/run
export async function POST(req: Request, { params }: RouteContext) {
  const { scenarioId } = await params
  try {
    const body: unknown = await req.json()
    const parsed = RunSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { deviceId, runtimeParams } = parsed.data
    const runId = await scenarioRunner.run(scenarioId, deviceId, runtimeParams)

    return NextResponse.json({ runId, status: 'completed' })
  } catch (error) {
    logger.error({ error, scenarioId }, 'POST /api/scenarios/[scenarioId]/run failed')

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      if (error.message.includes('disabled')) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
    }

    return NextResponse.json({ error: 'Failed to run scenario' }, { status: 500 })
  }
}
