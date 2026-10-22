'use client'
import { useState } from 'react'
import Link from 'next/link'
import { baht } from '@/lib/fmt'
import { useCart, QtyStepper } from '../CartProvider'
import { checkout } from '../actions'
type Cfg = { shipping: number; freeOver: number | null; promptpay: boolean; bank: boolean; cod: boolean }
const ERR: Record<string, string> = {
  stock: 'สินค้าบางรายการมีไม่พอ กรุณาปรับจำนวนในตะกร้าแล้วลองอีกครั้ง', method: 'วิธีชำระเงินนี้ไม่พร้อมใช้งาน กรุณาเลือกใหม่',
  gone: 'สินค้าบางรายการไม่มีจำหน่ายแล้ว กรุณานำออกจากตะกร้า', rate: 'สั่งซื้อถี่เกินไป กรุณารอสักครู่แล้วลองใหม่', empty: 'ตะกร้าว่างอยู่', invalid: 'กรอกข้อมูลไม่ครบหรือไม่ถูกต้อง (เบอร์โทรอย่างน้อย 8 หลัก ที่อยู่อย่างน้อย 5 ตัวอักษร)',
}
export default function CheckoutForm({ tenant, slug, cfg, error }: { tenant: string; slug: string; cfg: Cfg; error?: string }) {
  const { lines, subtotal, setQty, remove, ready } = useCart()
  const methods = [
    cfg.promptpay && { k: 'promptpay', t: 'พร้อมเพย์ (สแกน QR)', d: 'สแกนจ่ายด้วยแอปธนาคาร ยอดตรงกับออเดอร์' },
    cfg.bank && { k: 'bank', t: 'โอนเงินผ่านธนาคาร', d: 'โอนแล้วแนบสลิปในหน้าถัดไป' },
    cfg.cod && { k: 'cod', t: 'เก็บเงินปลายทาง', d: 'ชำระเงินสดเมื่อได้รับสินค้า' },
    { k: 'later', t: 'ให้ร้านติดต่อแจ้งวิธีชำระเงิน', d: 'ร้านจะโทรหรือแชตกลับเพื่อยืนยัน' },
  ].filter(Boolean) as { k: string; t: string; d: string }[]
  const [method, setMethod] = useState(methods[0].k)
  const ship = cfg.shipping > 0 && !(cfg.freeOver != null && subtotal >= cfg.freeOver) ? cfg.shipping : 0
  const base = `/s/${encodeURIComponent(slug)}`
  if (!ready) return <p className="py-20 text-center text-ink/50">กำลังโหลดตะกร้า…</p>
  if (!lines.length) return (
    <div className="py-20 text-center"><div className="text-5xl" aria-hidden>🛒</div><p className="mt-3 text-ink/70">ตะกร้าของคุณว่างอยู่</p><Link href={base} className="btn mt-5">เลือกซื้อสินค้า</Link></div>
  )
  return (
    <form action={checkout} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <input type="hidden" name="slug" value={slug} /><input type="hidden" name="tenant" value={tenant} />
      <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ product: l.id, qty: l.qty })))} />
      <div className="space-y-6">
        {error && <p role="alert" className="rounded-md bg-sun/30 p-3 text-sm">{ERR[error] ?? ERR.invalid}</p>}
        <section className="card">
          <h2 className="font-bold">1. ข้อมูลผู้รับ</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm">ชื่อ-นามสกุล<input name="name" required maxLength={120} autoComplete="name" className="input mt-1" /></label>
            <label className="text-sm">เบอร์โทร<input name="phone" required type="tel" minLength={8} maxLength={30} autoComplete="tel" className="input mt-1" /></label>
            <label className="text-sm md:col-span-2">ที่อยู่จัดส่ง<textarea name="address" required minLength={5} maxLength={500} rows={3} autoComplete="street-address" placeholder="บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" className="input mt-1" /></label>
            <label className="text-sm md:col-span-2">หมายเหตุถึงร้าน (ถ้ามี)<input name="note" maxLength={500} className="input mt-1" /></label>
          </div>
        </section>
        <section className="card">
          <h2 className="font-bold">2. วิธีชำระเงิน</h2>
          <div className="mt-4 space-y-2">
            {methods.map((m) => (
              <label key={m.k} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${method === m.k ? 'border-brand bg-brand/5' : 'border-ink/15'}`}>
                <input type="radio" name="method" value={m.k} checked={method === m.k} onChange={() => setMethod(m.k)} className="mt-1 accent-[#0E7C66]" />
                <span><span className="block text-sm font-medium">{m.t}</span><span className="block text-xs text-ink/60">{m.d}</span></span>
              </label>
            ))}
          </div>
        </section>
      </div>
      <aside className="h-fit rounded-xl border border-ink/10 bg-white p-5 lg:sticky lg:top-24">
        <h2 className="font-bold">สรุปคำสั่งซื้อ</h2>
        <ul className="mt-3 divide-y divide-ink/10">
          {lines.map((l) => (
            <li key={l.id} className="flex gap-3 py-3">
              {l.image ? <img src={l.image} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" /> : <div className="h-16 w-16 shrink-0 rounded-md bg-ink/5" />}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm">{l.name}</p>
                <div className="mt-1 flex items-center justify-between"><QtyStepper value={l.qty} max={l.max} label={l.name} onChange={(n) => setQty(l.id, n)} /><span className="text-sm font-medium">{baht(l.price * l.qty)}</span></div>
                <button type="button" onClick={() => remove(l.id)} className="mt-1 text-xs text-ink/50 underline hover:text-red-700">นำออก</button>
              </div>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
          <div className="flex justify-between"><dt className="text-ink/70">ยอดสินค้า</dt><dd>{baht(subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink/70">ค่าจัดส่ง</dt><dd>{ship ? baht(ship) : 'ฟรี'}</dd></div>
          {cfg.freeOver != null && ship > 0 && <p className="text-xs text-brand">ซื้อเพิ่มอีก {baht(cfg.freeOver - subtotal)} ส่งฟรี</p>}
          <div className="flex justify-between border-t border-ink/10 pt-2 text-lg font-bold"><dt>ยอดรวม</dt><dd className="text-brand">{baht(subtotal + ship)}</dd></div>
        </dl>
        <button className="btn mt-5 w-full justify-center py-3 text-base">ยืนยันคำสั่งซื้อ</button>
        <p className="mt-2 text-center text-xs text-ink/50">ราคาและค่าส่งจะถูกตรวจสอบอีกครั้งโดยระบบก่อนยืนยัน</p>
      </aside>
    </form>
  )
}
