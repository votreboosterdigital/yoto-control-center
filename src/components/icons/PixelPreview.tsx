interface Props {
  iconKey: string
  size?: number // px, défaut 64
  className?: string
}

const ICON_COLORS: Record<string, string> = {
  star: '#FFD700',
  heart: '#FF69B4',
  music: '#9B59B6',
  book: '#3498DB',
  moon: '#2C3E50',
  sun: '#F39C12',
  rocket: '#E74C3C',
  dragon: '#27AE60',
  crown: '#F1C40F',
  robot: '#95A5A6',
  flower: '#FF6B9D',
  sword: '#7F8C8D',
}

function isEmoji(str: string): boolean {
  // Détecte si la chaîne est un emoji (codepoint > 0x00FF ou séquence emoji)
  const firstCP = str.codePointAt(0) ?? 0
  return firstCP > 0x00FF
}

export function PixelPreview({ iconKey, size = 64, className }: Props) {
  const emoji = isEmoji(iconKey)
  const color = ICON_COLORS[iconKey] ?? '#6366F1'

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundColor: emoji ? 'transparent' : color,
        border: emoji ? '1px solid #e5e7eb' : undefined,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: emoji ? size * 0.72 : size * 0.45,
        color: emoji ? undefined : 'white',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {emoji ? iconKey : iconKey.charAt(0).toUpperCase()}
    </div>
  )
}
