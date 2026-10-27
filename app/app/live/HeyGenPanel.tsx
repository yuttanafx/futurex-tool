'use client'
import { T } from '@/components/Prefs'
const HEYGEN_URL = 'https://app.heygen.com/home'
// HeyGen ไม่อนุญาตให้ฝังเป็น iframe (refused to connect) จึงเปิดเป็นหน้าต่างแยกที่จอดอยู่ครึ่งขวาของจอ ใช้ข้างหน้าไลฟ์นี้ได้
function openSide() {
  const s = window.screen as Screen & { availLeft?: number; availTop?: number }
  const left = (s.availLeft ?? 0) + Math.floor(s.availWidth / 2)
  const top = s.availTop ?? 0
  const w = Math.floor(s.availWidth / 2)
  const h = s.availHeight
  window.open(HEYGEN_URL, 'heygen', `popup=yes,left=${left},top=${top},width=${w},height=${h},noopener`)
}
export default function HeyGenPanel() {
  return (
    <section aria-label="HeyGen" className="card flex flex-col items-start gap-4 xl:sticky xl:top-6">
      <h2 className="text-lg font-bold">HeyGen</h2>
      <p className="text-sm text-ink/70">
        <T
          th="HeyGen ไม่อนุญาตให้ฝังในเว็บอื่น จึงเปิดเป็นหน้าต่างแยกแทน กดปุ่มด้านล่างแล้วหน้าต่าง HeyGen จะมาอยู่ครึ่งขวาของจอ ส่วนหน้าไลฟ์นี้อยู่ครึ่งซ้าย (ล็อกอิน HeyGen ครั้งเดียวก็ใช้ต่อได้)"
          en="HeyGen does not allow embedding, so it opens in a separate window. The button below docks it to the right half of your screen, next to this Live page."
          zh="HeyGen 不允许嵌入其他网站，因此改为独立窗口打开。点击下方按钮，窗口会停靠在屏幕右半边，与本直播页并排使用。"
        />
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={openSide} className="btn"><T th="เปิด HeyGen ข้างจอ" en="Open HeyGen side-by-side" zh="并排打开 HeyGen" /></button>
        <a href={HEYGEN_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost"><T th="เปิดแท็บใหม่" en="New tab" zh="新标签页" /></a>
      </div>
      <p className="text-xs text-ink/60">
        <T
          th="ถ้าไม่มีอะไรเปิดขึ้น ให้อนุญาตป๊อปอัปของเว็บนี้ในเบราว์เซอร์ หรือกด “เปิดแท็บใหม่”"
          en="If nothing opens, allow pop-ups for this site, or use “New tab”."
          zh="如果没有打开，请允许本站弹出窗口，或使用“新标签页”。"
        />
      </p>
    </section>
  )
}
