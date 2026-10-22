'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { baht, discountPct } from '@/lib/fmt'
import AddButton from './AddButton'
export type GP = { id: string; name: string; price: number; compare: number | null; image: string | null; category: string | null; stock: number | null; description: string | null; sku: string | null }
const SORTS = [['new', 'มาใหม่'], ['low', 'ราคาต่ำ → สูง'], ['high', 'ราคาสูง → ต่ำ']] as const
export default function ProductGrid({ products, slug }: { products: GP[]; slug: string }) {
  const [cat, setCat] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>('new')
  const cats = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[], [products])
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const r = products.filter((p) => (!cat || p.category === cat) && (!s || `${p.name} ${p.sku ?? ''} ${p.description ?? ''}`.toLowerCase().includes(s)))
    return sort === 'low' ? [...r].sort((a, b) => a.price - b.price) : sort === 'high' ? [...r].sort((a, b) => b.price - a.price) : r
  }, [products, cat, q, sort])
  const base = `/s/${encodeURIComponent(slug)}`
  const chip = (on: boolean) => `shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${on ? 'border-brand bg-brand text-white' : 'border-ink/20 bg-white hover:border-brand'}`
  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="ค้นหาสินค้า…" aria-label="ค้นหาสินค้า" className="input md:max-w-xs" />
        <select value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="เรียงลำดับ" className="input md:ml-auto md:w-auto">
          {SORTS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {cats.length > 0 && (
        <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
          <button className={chip(!cat)} onClick={() => setCat(null)}>ทั้งหมด ({products.length})</button>
          {cats.map((c) => <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      )}
      {!list.length ? <p className="py-16 text-center text-ink/60">ไม่พบสินค้าที่ตรงกับการค้นหา</p> : (
        <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
          {list.map((p) => {
            const off = discountPct(p.price, p.compare)
            const out = p.stock === 0
            return (
              <li key={p.id} className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white transition hover:shadow-lg">
                <Link href={`${base}/products/${p.id}`} className="relative block aspect-square overflow-hidden bg-ink/5">
                  {p.image ? <img src={p.image} alt={p.name} loading="lazy" className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${out ? 'opacity-50' : ''}`} /> : <div className="grid h-full place-items-center text-4xl text-ink/20" aria-hidden>🛍️</div>}
                  {off > 0 && !out && <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>}
                  {out && <span className="absolute inset-x-0 bottom-0 bg-black/70 py-1 text-center text-xs text-white">สินค้าหมด</span>}
                  {!out && p.stock != null && p.stock <= 5 && <span className="absolute right-2 top-2 rounded-md bg-sun px-2 py-0.5 text-xs font-medium text-ink">เหลือ {p.stock}</span>}
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  {p.category && <p className="text-xs text-ink/50">{p.category}</p>}
                  <Link href={`${base}/products/${p.id}`} className="line-clamp-2 min-h-10 text-sm font-medium hover:text-brand">{p.name}</Link>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
                    <span className="text-lg font-bold text-brand">{baht(p.price)}</span>
                    {off > 0 && <span className="text-xs text-ink/40 line-through">{baht(p.compare!)}</span>}
                  </div>
                  <div className="mt-3 pt-1 md:mt-auto"><AddButton item={{ id: p.id, name: p.name, price: p.price, image: p.image, max: p.stock }} /></div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
