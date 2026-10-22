'use client'
import Link from 'next/link'
import { useCart } from './CartProvider'
export default function ShopHeader({ name, slug, free }: { name: string; slug: string; free?: string }) {
  const { count, setOpen, ready } = useCart()
  const base = `/s/${encodeURIComponent(slug)}`
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/95 backdrop-blur">
      {free && <div className="bg-brand px-4 py-1.5 text-center text-xs font-medium text-white">{free}</div>}
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
        <Link href={base} className="truncate text-lg font-bold">{name}</Link>
        <nav className="ml-auto hidden gap-6 text-sm md:flex">
          <Link href={base} className="hover:text-brand">หน้าร้าน</Link>
          <Link href={`${base}#products`} className="hover:text-brand">สินค้าทั้งหมด</Link>
          <Link href={`${base}/contact`} className="hover:text-brand">ติดต่อผู้ขาย</Link>
        </nav>
        <button onClick={() => setOpen(true)} className="relative ml-auto flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 text-sm font-medium hover:bg-ink/5 md:ml-0" aria-label={`ตะกร้าสินค้า ${count} ชิ้น`}>
          <span aria-hidden>🛒</span><span className="hidden sm:inline">ตะกร้า</span>
          {ready && count > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-xs font-bold text-white">{count}</span>}
        </button>
      </div>
    </header>
  )
}
