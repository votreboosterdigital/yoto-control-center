import { NextResponse } from 'next/server'
import { z } from 'zod'
import path from 'path'
import { downloadIcons } from '@/lib/yotoicons/scraper'
import { logger } from '@/lib/logger'

const Schema = z.object({
  ids: z
    .array(z.string().regex(/^\d+$/, 'ID doit être numérique'))
    .min(1, 'Au moins un ID requis')
    .max(500, 'Maximum 500 icônes par batch'),
})

const DEST_DIR = path.join(process.cwd(), 'public', 'yotoicons')

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = Schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Données invalides' },
        { status: 400 },
      )
    }

    const icons = parsed.data.ids.map((id) => ({
      id,
      previewUrl: `https://yotoicons.com/static/uploads/${id}.png`,
    }))

    const results = await downloadIcons(icons, DEST_DIR)

    const ok = results.filter((r) => r.ok)
    const failed = results.filter((r) => !r.ok)

    logger.info({ total: icons.length, ok: ok.length, failed: failed.length }, 'yotoicons download terminé')

    return NextResponse.json({
      ok: ok.length,
      failed: failed.length,
      // Retourner les paths web accessibles
      downloaded: ok.map((r) => ({ id: r.id, path: `/yotoicons/${r.id}.png` })),
      errors: failed.map((r) => ({ id: r.id, error: r.error })),
    })
  } catch (error) {
    logger.error({ error }, 'POST /api/yotoicons/download failed')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur serveur' },
      { status: 500 },
    )
  }
}
