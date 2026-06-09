import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

type RouteContext = { params: Promise<{ scenarioId: string }> }

// GET /api/scenarios/[scenarioId]
export async function GET(_req: Request, { params }: RouteContext) {
  const { scenarioId } = await params
  try {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        enabled: true,
        steps: true,
        trigger: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    return NextResponse.json({ scenario })
  } catch (error) {
    logger.error({ error, scenarioId }, 'GET /api/scenarios/[scenarioId] failed')
    return NextResponse.json({ error: 'Failed to get scenario' }, { status: 500 })
  }
}

const PatchScenarioSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  steps: z.array(z.unknown()).optional(),
})

// PATCH /api/scenarios/[scenarioId]
export async function PATCH(req: Request, { params }: RouteContext) {
  const { scenarioId } = await params
  try {
    const body: unknown = await req.json()
    const parsed = PatchScenarioSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { name, description, enabled, steps } = parsed.data

    const scenario = await prisma.scenario.update({
      where: { id: scenarioId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(enabled !== undefined && { enabled }),
        ...(steps !== undefined && { steps: JSON.stringify(steps) }),
      },
    })

    return NextResponse.json({ scenario })
  } catch (error) {
    logger.error({ error, scenarioId }, 'PATCH /api/scenarios/[scenarioId] failed')
    const isNotFound = error instanceof Error && error.message.includes('Record to update not found')
    return NextResponse.json(
      { error: isNotFound ? 'Scenario not found' : 'Failed to update scenario' },
      { status: isNotFound ? 404 : 500 }
    )
  }
}
