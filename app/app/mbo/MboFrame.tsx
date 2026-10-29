'use client'
import { useState } from 'react'
import { T } from '@/components/Prefs'

// ค่าเริ่มต้นฝังหน้าล็อกอินจริงในแดชบอร์ด · ถ้ากรอบว่าง (เว็บไม่อนุญาตให้ฝัง) กด “กลับไปแบบรูป + ลิงก์”
export default function MboFrame({ src }: { src: string }) {
  const [frame, setFrame] = useState(true)
  return frame ? (
    <>
      <button type="button" onClick={() => setFrame(false)} className="btn-ghost mt-4">
        <T th="กรอบว่าง/ล็อกอินไม่ได้? กดที่นี่เพื่อใช้แบบรูป + ลิงก์" en="Blank or can't sign in? Use image + link instead" zh="空白或无法登录？改用图片与链接" />
      </button>
      <iframe
        src={src}
        title="FutureX Member Login"
        className="mt-4 block w-full rounded-xl border border-ink/10 bg-white"
        style={{ height: 'calc(100vh - 11rem)', minHeight: 560 }}
        allow="clipboard-write; clipboard-read; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </>
  ) : (
    <div className="mt-6 flex flex-col items-center gap-4">
      <a href={src} target="_blank" rel="noopener noreferrer" className="block max-w-sm overflow-hidden rounded-2xl border border-ink/10 shadow-lg transition hover:shadow-xl">
        <img src="/mbo-login.jpg" alt="FutureX Member Login" className="block w-full" />
      </a>
      <a href={src} target="_blank" rel="noopener noreferrer" className="btn">
        <T th="ไปหน้าล็อกอินสมาชิก FutureX ↗" en="Go to FutureX member login ↗" zh="前往 FutureX 会员登录 ↗" />
      </a>
      <button type="button" onClick={() => setFrame(true)} className="text-xs underline text-ink/60">
        <T th="ลองแสดงในกรอบนี้" en="Try showing it in this frame" zh="尝试在此框内显示" />
      </button>
    </div>
  )
}
