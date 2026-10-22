'use client'
import { useState } from 'react'
const LABEL: Record<string, string> = { price: 'ราคา', usage: 'วิธีใช้', stock: 'สต็อก', shipping: 'การจัดส่ง', promo: 'โปรโมชั่น', other: 'อื่น ๆ' }
type Item = { q: string; category: string; reply: string }
export default function LiveBoard() {
  const [text, setText] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [products, setProducts] = useState<{ name: string; price: number }[]>([])
  const [busy, setBusy] = useState(false)
  const [paused, setPaused] = useState(false)
  const [err, setErr] = useState('')
  async function run() {
    const comments = text.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!comments.length || busy || paused) return
    setBusy(true); setErr('')
    const r = await fetch('/api/v1/live/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comments }) })
    const j = await r.json().catch(() => ({}))
    if (r.ok) { setItems((p) => [...j.items, ...p]); setProducts(j.products); setText('') }
    else setErr(r.status === 429 ? 'โควตา AI วันนี้เต็มแล้ว' : r.status === 403 ? 'ผู้ช่วย AI ปิดอยู่ เปิดได้ที่หน้า AI' : 'วิเคราะห์ไม่สำเร็จ ลองใหม่อีกครั้ง')
    setBusy(false)
  }
  const counts = Object.keys(LABEL).map((k) => [k, items.filter((i) => i.category === k).length] as const).filter(([, n]) => n)
  return (
    <>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} className="input mt-4" aria-label="คอมเมนต์จากไลฟ์" placeholder="วางคอมเมนต์จากไลฟ์ บรรทัดละ 1 ข้อความ (ครั้งละไม่เกิน 20)" />
      <div className="mt-3 flex gap-2">
        <button onClick={run} disabled={busy || paused} className="btn">{busy ? 'กำลังวิเคราะห์…' : 'จัดกลุ่มและร่างคำตอบ'}</button>
        <button onClick={() => setPaused(!paused)} className="rounded-md border border-ink/20 px-4 py-2 text-sm font-medium hover:bg-white">{paused ? 'เปิด AI' : 'หยุด AI'}</button>
      </div>
      {paused && <p className="mt-2 text-sm text-ink/70">AI หยุดอยู่ คุณตอบเองได้เต็มที่</p>}
      {err && <p role="alert" className="mt-3 rounded-md bg-sun/30 p-3 text-sm">{err}</p>}
      {!!items.length && <p className="mt-6 text-sm text-ink/70">คำถามทั้งหมด {items.length} · {counts.map(([k, n]) => `${LABEL[k]} ${n}`).join(' · ')}</p>}
      <ul className="mt-3 divide-y divide-ink/10">
        {items.map((i, n) => (
          <li key={n} className="py-3">
            <div className="text-xs text-ink/60">{LABEL[i.category]}</div>
            <div className="text-sm font-medium">{i.q}</div>
            <div className="mt-1 flex items-start justify-between gap-3 text-sm"><span>{i.reply}</span><button onClick={() => navigator.clipboard?.writeText(i.reply)} className="shrink-0 underline">คัดลอก</button></div>
          </li>
        ))}
      </ul>
      {!!products.length && (
        <>
          <h2 className="mt-8 text-lg font-bold">การ์ดสินค้าไว้ชูหน้ากล้อง</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
            {products.slice(0, 12).map((p, n) => <li key={n} className="rounded-md bg-white p-3 text-sm"><div className="font-medium">{p.name}</div><div>฿{new Intl.NumberFormat('th-TH').format(p.price)}</div></li>)}
          </ul>
        </>
      )}
    </>
  )
}
