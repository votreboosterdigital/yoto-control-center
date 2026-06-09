export function Header() {
  return (
    <header className="border-b px-6 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-green-500 inline-block" />
        Mock Mode
      </div>
    </header>
  )
}
