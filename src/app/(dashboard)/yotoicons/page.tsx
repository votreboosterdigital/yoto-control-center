import { YotoIconsBrowser } from '@/components/yotoicons/YotoIconsBrowser'

export default function YotoIconsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Icônes yotoicons.com</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Recherche et téléchargement en bulk depuis la bibliothèque communautaire
        </p>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
        <strong>Source :</strong> <a href="https://yotoicons.com" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">yotoicons.com</a>
        {' '}— bibliothèque communautaire d&apos;icônes pour le Yoto Player.
        Les fichiers téléchargés sont sauvegardés dans <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">public/yotoicons/</code> et
        accessibles via <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">/yotoicons/&#123;id&#125;.png</code>.
      </div>

      <YotoIconsBrowser />
    </div>
  )
}
