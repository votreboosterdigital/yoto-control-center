'use client'

import { useState } from 'react'
import { IconGallery } from './IconGallery'
import { PixelPreview } from './PixelPreview'

export function IconsExplorer() {
  const [selectedKey, setSelectedKey] = useState<string | undefined>()

  return (
    <div className="space-y-4">
      {selectedKey && (
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
          <PixelPreview iconKey={selectedKey} size={56} />
          <div>
            <p className="font-medium">{selectedKey}</p>
            <p className="text-xs text-muted-foreground">Icône sélectionnée</p>
          </div>
        </div>
      )}
      <div className="rounded-lg border p-4">
        <IconGallery onSelect={setSelectedKey} selectedKey={selectedKey} />
      </div>
    </div>
  )
}
