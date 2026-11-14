'use client'
import { useState } from 'react'
import { T } from '@/components/Prefs'

// ฝังเว็บ TikTok App ในแดชบอร์ด (ล็อกอินได้ในกรอบ) · ถ้ากรอบว่าง/ล็อกอินไม่ได้ สลับเป็นปุ่มลิงก์ไปแท็บใหม่
export default function TiktokFrame({ src }: { src: string }) {
  const [frame, setFrame] = useState(true)
  return frame ? (
    <>
      <button type="button" onClick={() => setFrame(false)} className="btn-ghost mt-4">
        <T th="กรอบว่าง/ล็อกอินไม่ได้? กดที่นี่เพื่อใช้แบบลิงก์" en="Blank or can't sign in? Use the link instead" zh="空白或无法登录？改用链接" />
      </button>
      <iframe
        src={src}
        title="TikTok App"
        className="mt-4 block w-full rounded-xl border border-ink/10 bg-white"
        style={{ height: 'calc(100vh - 11rem)', minHeight: 560 }}
        allow="clipboard-write; clipboard-read; fullscreen; microphone; camera; storage-access"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </>
  ) : (
    <div className="mt-8 flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-ink/70">
        <T th="เปิด TikTok App ในแท็บใหม่เพื่อล็อกอินและใช้งานเต็มรูปแบบ" en="Open TikTok App in a new tab to sign in and use it fully" zh="在新标签页打开 TikTok App 以登录并完整使用" />
      </p>
      <a href={src} target="_blank" rel="noopener noreferrer" className="btn">
        <T th="เปิด TikTok App ↗" en="Open TikTok App ↗" zh="打开 TikTok App ↗" />
      </a>
      <button type="button" onClick={() => setFrame(true)} className="text-xs underline text-ink/60">
        <T th="ลองแสดงในกรอบนี้อีกครั้ง" en="Try the frame again" zh="再次尝试在框内显示" />
      </button>
    </div>
  )
}
