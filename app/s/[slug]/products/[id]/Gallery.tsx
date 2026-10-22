'use client'
import { useState } from 'react'
export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0)
  if (!images.length) return <div className="grid aspect-square place-items-center rounded-2xl bg-ink/5 text-6xl text-ink/20" aria-hidden>🛍️</div>
  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-2xl border border-ink/10 bg-white"><img src={images[i]} alt={name} className="h-full w-full object-cover" /></div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2">
          {images.map((u, k) => (
            <li key={u}><button type="button" onClick={() => setI(k)} aria-label={`รูปที่ ${k + 1}`} className={`aspect-square w-full overflow-hidden rounded-lg border-2 ${k === i ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'}`}><img src={u} alt="" className="h-full w-full object-cover" /></button></li>
          ))}
        </ul>
      )}
    </div>
  )
}
