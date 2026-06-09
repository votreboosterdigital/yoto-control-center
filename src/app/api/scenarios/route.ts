import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// GET /api/scenarios — liste tous les scénarios
export async function GET() {
  try {
    const scenarios = await prisma.scenario.findMany({
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
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ scenarios })
  } catch (error) {
    logger.error({ error }, 'GET /api/scenarios failed')
    return NextResponse.json({ error: 'Failed to list scenarios' }, { status: 500 })
  }
}

const CreateScenarioSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'slug doit être en kebab-case'),
  name: z.string().min(1),
  description: z.string().optional(),
  steps: z.array(z.unknown()),
  enabled: z.boolean().optional().default(true),
})

// POST /api/scenarios — crée un scénario
export async function POST(req: Request) {
  try {
    const body: unknown = await req.json()
    const parsed = CreateScenarioSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { slug, name, description, steps, enabled } = parsed.data

    const scenario = await prisma.scenario.create({
      data: {
        slug,
        name,
        description,
        enabled,
        steps: JSON.stringify(steps),
      },
    })

    return NextResponse.json({ scenario }, { status: 201 })
  } catch (error) {
    logger.error({ error }, 'POST /api/scenarios failed')
    const isUnique = error instanceof Error && error.message.includes('Unique constraint')
    return NextResponse.json(
      { error: isUnique ? 'Slug already exists' : 'Failed to create scenario' },
      { status: isUnique ? 409 : 500 }
    )
  }
}
