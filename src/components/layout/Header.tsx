const isMock = process.env.ENABLE_MOCK_PROVIDER === 'true'

export function Header() {
  return (
    <header className="border-b px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-3">
        {isMock && (
          <div className="flex items-center gap-2 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" />
            Mode simulation
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
          {isMock ? 'Mock Provider' : 'Yoto connecté'}
        </div>
      </div>
    </header>
  )
}
