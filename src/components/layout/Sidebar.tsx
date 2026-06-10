'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/devices', label: 'Devices', icon: '🎵' },
  { href: '/scenarios', label: 'Scénarios', icon: '✨' },
  { href: '/scheduling', label: 'Planning', icon: '🕐' },
  { href: '/library', label: 'Bibliothèque', icon: '📚' },
  { href: '/icons', label: 'Icônes', icon: '🎨' },
  { href: '/yotoicons', label: 'yotoicons.com', icon: '🖼' },
  { href: '/logs', label: 'Logs', icon: '📋' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-56 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <h1 className="font-bold text-lg">Yoto Control</h1>
        <p className="text-xs text-muted-foreground">Cockpit parental</p>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === item.href
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            )}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
