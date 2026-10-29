'use client'
import { useState } from 'react'
import { T } from '@/components/Prefs'

// ฝังเว็บผู้ช่วย AI ในแดชบอร์ด · ถ้ากรอบว่าง (เว็บไม่อนุญาตให้ฝัง) สลับเป็นปุ่มลิงก์ไปเปิดในแท็บใหม่
export default function AiFrame({ src }: { src: string }) {
  const [frame, setFrame] = useState(true)
  return frame ? (
    <>
      <button type="button" onClick={() => setFrame(false)} className="btn-ghost mt-4">
        <T th="กรอบว่าง/ใช้งานไม่ได้? กดที่นี่เพื่อใช้แบบลิงก์" en="Blank or not working? Use the link instead" zh="空白或无法使用？改用链接" />
      </button>
      <iframe
        src={src}
        title="AI Platform"
        className="mt-4 block w-full rounded-xl border border-ink/10 bg-white"
        style={{ height: 'calc(100vh - 11rem)', minHeight: 560 }}
        allow="clipboard-write; clipboard-read; fullscreen; microphone; camera"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </>
  ) : (
    <div className="mt-8 flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-ink/70">
        <T th="เปิดผู้ช่วย AI ในแท็บใหม่เพื่อใช้งานเต็มรูปแบบ" en="Open the AI assistant in a new tab for full use" zh="在新标签页打开 AI 助手以完整使用" />
      </p>
      <a href={src} target="_blank" rel="noopener noreferrer" className="btn">
        <T th="เปิดผู้ช่วย AI ↗" en="Open AI assistant ↗" zh="打开 AI 助手 ↗" />
      </a>
      <button type="button" onClick={() => setFrame(true)} className="text-xs underline text-ink/60">
        <T th="ลองแสดงในกรอบนี้อีกครั้ง" en="Try the frame again" zh="再次尝试在框内显示" />
      </button>
    </div>
  )
}
