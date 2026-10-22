'use client'
import { useEffect, useState } from 'react'
type M = { role: 'user' | 'assistant' | 'staff'; content: string }
const ROLE = { customer: 'user', ai: 'assistant', staff: 'staff' } as const
const ERR: Record<number, string> = { 429: 'วันนี้ผู้ช่วยตอบครบโควตาแล้ว กรุณาติดต่อร้านโดยตรง', 403: 'ผู้ช่วย AI ของร้านนี้ปิดอยู่' }
export default function ChatBox({ tenant }: { tenant: string }) {
  const [msgs, setMsgs] = useState<M[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [conv, setConv] = useState<string | null>(null)
  const [human, setHuman] = useState(false)
  const [asking, setAsking] = useState(false)
  const [contact, setContact] = useState('')
  useEffect(() => {
    if (!human || !conv) return
    const t = setInterval(async () => {
      const r = await fetch(`/api/v1/ai/messages?tenant=${tenant}&conversation=${conv}`)
      if (r.ok) { const j = await r.json(); setMsgs(j.messages.map((m: any) => ({ role: ROLE[m.sender_type as keyof typeof ROLE] ?? 'assistant', content: m.content }))); if (!j.needsHuman) setHuman(false) }
    }, 8000)
    return () => clearInterval(t)
  }, [human, conv, tenant])
  async function send(e: React.FormEvent) {
    e.preventDefault()
    const message = text.trim()
    if (!message || busy) return
    setText(''); setBusy(true)
    const history = msgs.filter((m) => m.role !== 'staff') as { role: 'user' | 'assistant'; content: string }[]
    setMsgs([...msgs, { role: 'user', content: message }])
    try {
      const r = await fetch('/api/v1/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant, message, history, conversation: conv }) })
      const j = await r.json().catch(() => ({}))
      const reply = r.ok ? j.reply : j.error === 'rate' ? 'ส่งถี่เกินไป รอสักครู่แล้วลองใหม่' : ERR[r.status] ?? 'ระบบขัดข้อง ลองใหม่อีกครั้ง'
      if (r.ok) { setConv(j.conversation); if (j.handoff) setHuman(true) }
      setMsgs((m) => [...m, { role: 'assistant', content: reply }])
    } catch { setMsgs((m) => [...m, { role: 'assistant', content: 'ระบบขัดข้อง ลองใหม่อีกครั้ง' }]) }
    setBusy(false)
  }
  async function handoff(e: React.FormEvent) {
    e.preventDefault()
    const r = await fetch('/api/v1/ai/handoff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tenant, contact, conversation: conv }) })
    const j = await r.json().catch(() => ({}))
    if (r.ok) { setConv(j.conversation); setHuman(true); setAsking(false); setMsgs((m) => [...m, { role: 'assistant', content: 'ส่งเรื่องให้เจ้าหน้าที่แล้ว จะตอบกลับที่นี่หรือติดต่อตามช่องทางที่คุณให้ไว้' }]) }
    else setMsgs((m) => [...m, { role: 'assistant', content: j.error === 'rate' ? 'ส่งถี่เกินไป รอสักครู่แล้วลองใหม่' : 'ส่งเรื่องไม่สำเร็จ ลองใหม่อีกครั้ง' }])
  }
  return (
    <section aria-label="ถามผู้ช่วยของร้าน" className="mt-12 border-t border-ink/10 pt-8">
      <h2 className="text-xl font-bold">ถามเกี่ยวกับสินค้า</h2>
      <div className="mt-4 space-y-3" aria-live="polite">
        {msgs.map((m, i) => (
          <p key={i} className={m.role === 'user' ? 'ml-10 rounded-md bg-brand/10 p-3 text-sm' : m.role === 'staff' ? 'mr-10 rounded-md border border-brand p-3 text-sm' : 'mr-10 rounded-md bg-white p-3 text-sm'}>{m.role === 'staff' && <strong>เจ้าหน้าที่: </strong>}{m.content}</p>
        ))}
        {busy && <p className="text-sm text-ink/60">กำลังพิมพ์…</p>}
      </div>
      <form onSubmit={send} className="mt-4 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="เช่น สินค้าไหนเหมาะกับผู้เริ่มต้น" aria-label="ข้อความ" className="input" />
        <button className="btn" disabled={busy}>ส่ง</button>
      </form>
      {!human && !asking && <button onClick={() => setAsking(true)} className="mt-3 text-sm underline">คุยกับเจ้าหน้าที่</button>}
      {asking && (
        <form onSubmit={handoff} className="mt-3 flex gap-2">
          <input value={contact} onChange={(e) => setContact(e.target.value)} required maxLength={100} placeholder="เบอร์โทรหรือ LINE ID สำหรับติดต่อกลับ" aria-label="ช่องทางติดต่อกลับ" className="input" />
          <button className="btn">ส่งเรื่อง</button>
        </form>
      )}
    </section>
  )
}
