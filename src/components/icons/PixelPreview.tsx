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

export function PixelPreview({ iconKey, size = 64, className }: Props) {
  const color = ICON_COLORS[iconKey] ?? '#6366F1'
  const initial = iconKey.charAt(0).toUpperCase()

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 4,
        fontSize: size * 0.45,
        color: 'white',
        fontWeight: 'bold',
        fontFamily: 'monospace',
        imageRendering: 'pixelated',
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  )
}
