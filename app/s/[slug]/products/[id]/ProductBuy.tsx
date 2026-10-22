'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, QtyStepper, type Line } from '../../CartProvider'
export default function ProductBuy({ item, slug }: { item: Omit<Line, 'qty'>; slug: string }) {
  const { add } = useCart()
  const r = useRouter()
  const [qty, setQty] = useState(1)
  const out = item.max === 0
  const cap = (n: number) => Math.max(1, Math.min(100, item.max ?? 100, n))
  return (
    <div className="mt-6">
      <div className="flex items-center gap-4">
        <span className="text-sm text-ink/70">จำนวน</span>
        <QtyStepper value={qty} max={item.max} label={item.name} onChange={(n) => setQty(cap(n))} />
        {item.max != null && item.max > 0 && <span className="text-xs text-ink/50">มีสินค้า {item.max} ชิ้น</span>}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button type="button" disabled={out} onClick={() => add(item, qty)} className="btn-ghost justify-center border-brand py-3 text-base text-brand disabled:opacity-40">🛒 เพิ่มลงตะกร้า</button>
        <button type="button" disabled={out} onClick={() => { add(item, qty, false); r.push(`/s/${encodeURIComponent(slug)}/checkout`) }} className="btn justify-center py-3 text-base disabled:cursor-not-allowed disabled:bg-ink/20">{out ? 'สินค้าหมด' : 'ซื้อเลย'}</button>
      </div>
    </div>
  )
}
