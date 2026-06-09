import { NextResponse } from 'next/server'
import { z } from 'zod'
import { iconService } from '@/server/services/IconService'
import { logger } from '@/lib/logger'

const AssignIconSchema = z.object({
  sourceType: z.enum(['track', 'playlist', 'scenario']),
  sourceId: z.string().min(1),
  iconKey: z.string().min(1),
  mode: z.enum(['manual', 'auto']).optional().default('manual'),
  previewUrl: z.string().url().optional(),
})

// POST /api/icons/assign
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: unknown = await req.json()
    const parsed = AssignIconSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { sourceType, sourceId, iconKey, mode, previewUrl } = parsed.data

    await iconService.assignIcon(sourceType, sourceId, iconKey, mode, previewUrl)

    return NextResponse.json({ success: true, sourceType, sourceId, iconKey, mode })
  } catch (error) {
    logger.error({ error }, 'POST /api/icons/assign failed')
    return NextResponse.json({ error: 'Erreur lors de l\'assignation de l\'icône' }, { status: 500 })
  }
}
