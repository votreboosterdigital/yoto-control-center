export type IconSourceType = 'track' | 'playlist' | 'scenario'
export type IconMode = 'manual' | 'auto'

export interface IconMapping {
  id: string
  sourceType: IconSourceType
  sourceId: string
  iconKey: string
  mode: IconMode
  previewUrl?: string
  /** JSON string représentant la matrice 16x16 de pixels */
  pixelData?: string
}

/** Matrice 16x16 de couleurs hex */
export type PixelMatrix = string[][]
