'use client'
import { useState } from 'react'
import { T } from '@/components/Prefs'
const HEYGEN_URL = 'https://app.heygen.com/home'
export default function HeyGenPanel() {
  const [key, setKey] = useState(0)
  const [loaded, setLoaded] = useState(false)
  function popup() {
    const w = Math.min(1280, window.screen.availWidth - 80)
    const h = Math.min(860, window.screen.availHeight - 80)
    window.open(HEYGEN_URL, 'heygen', `popup=yes,width=${w},height=${h},noopener`)
  }
  return (
    <section aria-label="HeyGen" className="card flex flex-col xl:sticky xl:top-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-bold">HeyGen</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { setLoaded(false); setKey((k) => k + 1) }} className="btn-ghost"><T th="โหลดใหม่" en="Reload" zh="重新加载" /></button>
          <button type="button" onClick={popup} className="btn-ghost"><T th="หน้าต่างแยก" en="Pop-out" zh="独立窗口" /></button>
          <a href={HEYGEN_URL} target="_blank" rel="noopener noreferrer" className="btn"><T th="เปิดแท็บใหม่" en="New tab" zh="新标签页" /></a>
        </div>
      </div>
      <div className="relative mt-3 h-[70vh] min-h-[420px] overflow-hidden rounded-md border border-ink/10 bg-white xl:h-[calc(100vh-11rem)]">
        {!loaded && <p className="absolute inset-0 grid place-items-center text-sm text-ink/60">กำลังโหลด HeyGen…</p>}
        <iframe
          key={key}
          src={HEYGEN_URL}
          title="HeyGen"
          onLoad={() => setLoaded(true)}
          allow="camera; microphone; clipboard-read; clipboard-write; fullscreen; autoplay; display-capture"
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
      <p className="mt-3 text-xs text-ink/60">
        <T
          th="ถ้ากรอบขึ้นว่างหรือปฏิเสธการเชื่อมต่อ แปลว่า HeyGen ไม่อนุญาตให้ฝังในเว็บอื่น ให้ใช้ปุ่ม “หน้าต่างแยก” หรือ “เปิดแท็บใหม่” แทน"
          en="If the frame is blank or refused, HeyGen does not allow embedding. Use “Pop-out” or “New tab” instead."
          zh="如果框架空白或被拒绝，说明 HeyGen 不允许嵌入，请改用“独立窗口”或“新标签页”。"
        />
      </p>
    </section>
  )
}
