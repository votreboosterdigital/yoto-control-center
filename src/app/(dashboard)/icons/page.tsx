import { prisma } from '@/lib/prisma'
import { PixelPreview } from '@/components/icons/PixelPreview'
import { IconsExplorer } from '@/components/icons/IconsExplorer'

interface IconMappingRow {
  id: string
  sourceType: string
  sourceId: string
  iconKey: string
  mode: string
  previewUrl: string | null
  createdAt: Date
  updatedAt: Date
}

async function getIconMappings(): Promise<IconMappingRow[]> {
  return prisma.iconMapping.findMany({
    select: {
      id: true,
      sourceType: true,
      sourceId: true,
      iconKey: true,
      mode: true,
      previewUrl: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  })
}

export default async function IconsPage() {
  const mappings = await getIconMappings()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Icônes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Étiquettes visuelles pour organiser tes scénarios dans cette app.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {mappings.length} assignation{mappings.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Notice */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 text-sm text-amber-800 dark:text-amber-200">
        <strong>Note :</strong> Ces icônes s&apos;affichent uniquement dans cette application web.
        Elles n&apos;apparaissent <em>pas</em> sur l&apos;écran physique du Yoto — celui-ci affiche l&apos;artwork intégré à chaque carte, géré par l&apos;app Yoto.
      </div>

      {/* Assignations existantes */}
      {mappings.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-4">Assignations existantes</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mappings.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <PixelPreview iconKey={m.iconKey} size={48} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{m.iconKey}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {m.sourceType} · {m.sourceId}
                  </p>
                  <span className="text-xs text-muted-foreground capitalize">{m.mode}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Explorateur d'icônes */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Explorer les icônes</h3>
        <IconsExplorer />
      </section>
    </div>
  )
}
