'use client'
import { useCart, type Line } from './CartProvider'
export default function AddButton({ item, className = '' }: { item: Omit<Line, 'qty'>; className?: string }) {
  const { add } = useCart()
  const out = item.max === 0
  return (
    <button type="button" disabled={out} onClick={() => add(item, 1)} className={`btn w-full justify-center disabled:cursor-not-allowed disabled:bg-ink/20 ${className}`}>
      {out ? 'สินค้าหมด' : 'เพิ่มลงตะกร้า'}
    </button>
  )
}
