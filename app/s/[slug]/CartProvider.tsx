'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { baht } from '@/lib/fmt'

export type Line = { id: string; name: string; price: number; image: string | null; qty: number; max: number | null }
type Ctx = {
  slug: string; lines: Line[]; count: number; subtotal: number; ready: boolean
  open: boolean; setOpen: (b: boolean) => void
  add: (l: Omit<Line, 'qty'>, qty?: number, openDrawer?: boolean) => void
  setQty: (id: string, n: number) => void; remove: (id: string) => void; clear: () => void
}
const C = createContext<Ctx | null>(null)
export const useCart = () => { const c = useContext(C); if (!c) throw new Error('CartProvider missing'); return c }
const clamp = (n: number, max: number | null) => Math.max(0, Math.min(100, max ?? 100, Math.floor(n) || 0))

export default function CartProvider({ slug, children }: { slug: string; children: React.ReactNode }) {
  const key = `cart:${slug}`
  const [lines, setLines] = useState<Line[]>([])
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(v)) setLines(v.filter((l) => l?.id && l.qty > 0).slice(0, 20)) } catch {}
    setReady(true)
  }, [key])
  useEffect(() => { if (ready) try { localStorage.setItem(key, JSON.stringify(lines)) } catch {} }, [lines, ready, key])
  const add = useCallback<Ctx['add']>((l, qty = 1, openDrawer = true) => {
    setLines((s) => {
      const cur = s.find((x) => x.id === l.id)
      if (cur) return s.map((x) => (x.id === l.id ? { ...x, ...l, qty: clamp(x.qty + qty, l.max) } : x))
      return [...s, { ...l, qty: clamp(qty, l.max) || 1 }].slice(0, 20)
    })
    if (openDrawer) setOpen(true)
  }, [])
  const setQty = useCallback((id: string, n: number) => setLines((s) => s.flatMap((x) => (x.id !== id ? [x] : clamp(n, x.max) > 0 ? [{ ...x, qty: clamp(n, x.max) }] : []))), [])
  const remove = useCallback((id: string) => setLines((s) => s.filter((x) => x.id !== id)), [])
  const clear = useCallback(() => setLines([]), [])
  const v = useMemo<Ctx>(() => ({
    slug, lines, ready, open, setOpen, add, setQty, remove, clear,
    count: lines.reduce((a, l) => a + l.qty, 0), subtotal: lines.reduce((a, l) => a + l.qty * l.price, 0),
  }), [slug, lines, ready, open, add, setQty, remove, clear])
  return <C.Provider value={v}>{children}<Drawer /></C.Provider>
}

export function QtyStepper({ value, onChange, max, label }: { value: number; onChange: (n: number) => void; max?: number | null; label: string }) {
  const b = 'grid h-8 w-8 place-items-center text-lg leading-none hover:bg-ink/5 disabled:opacity-30'
  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-ink/20 bg-white">
      <button type="button" className={b} aria-label={`ลด ${label}`} onClick={() => onChange(value - 1)}>−</button>
      <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className={b} aria-label={`เพิ่ม ${label}`} disabled={max != null && value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}

function Drawer() {
  const { open, setOpen, lines, subtotal, setQty, remove, slug } = useCart()
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, setOpen])
  const base = `/s/${encodeURIComponent(slug)}`
  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      <aside role="dialog" aria-label="ตะกร้าสินค้า" className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <h2 className="text-lg font-bold">ตะกร้าสินค้า</h2>
          <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-ink/5" aria-label="ปิด" onClick={() => setOpen(false)}>✕</button>
        </div>
        {!lines.length ? (
          <div className="grid flex-1 place-items-center px-6 text-center text-ink/60">
            <div><div className="text-5xl" aria-hidden>🛒</div><p className="mt-3">ตะกร้ายังว่างอยู่</p><button className="btn mt-4" onClick={() => setOpen(false)}>เลือกซื้อสินค้า</button></div>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-5">
              {lines.map((l) => (
                <li key={l.id} className="flex gap-3 py-4">
                  {l.image ? <img src={l.image} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" /> : <div className="h-20 w-20 shrink-0 rounded-lg bg-ink/5" />}
                  <div className="min-w-0 flex-1">
                    <Link href={`${base}/products/${l.id}`} onClick={() => setOpen(false)} className="line-clamp-2 text-sm font-medium hover:underline">{l.name}</Link>
                    <p className="mt-0.5 text-sm text-brand">{baht(l.price)}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <QtyStepper value={l.qty} max={l.max} label={l.name} onChange={(n) => setQty(l.id, n)} />
                      <button className="text-xs text-ink/50 underline hover:text-red-700" onClick={() => remove(l.id)}>ลบ</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink/10 bg-mist px-5 py-4">
              <p className="flex justify-between text-sm"><span className="text-ink/70">ยอดสินค้า</span><span className="text-lg font-bold">{baht(subtotal)}</span></p>
              <p className="mt-1 text-xs text-ink/50">ค่าจัดส่งคำนวณในหน้าชำระเงิน</p>
              <Link href={`${base}/checkout`} onClick={() => setOpen(false)} className="btn mt-3 w-full justify-center py-3 text-base">ชำระเงิน</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
