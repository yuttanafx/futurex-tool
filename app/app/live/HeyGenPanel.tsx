'use client'
import { T } from '@/components/Prefs'
const HEYGEN_URL = 'https://app.heygen.com/home'
// HeyGen ไม่อนุญาตให้ฝังเป็น iframe จึงแสดงเป็นรูป + ลิงก์ใต้รูปที่พาไปเว็บ HeyGen
function openSide() {
  const s = window.screen as Screen & { availLeft?: number; availTop?: number }
  const left = (s.availLeft ?? 0) + Math.floor(s.availWidth / 2)
  const top = s.availTop ?? 0
  window.open(HEYGEN_URL, 'heygen', `popup=yes,left=${left},top=${top},width=${Math.floor(s.availWidth / 2)},height=${s.availHeight},noopener`)
}
export default function HeyGenPanel() {
  return (
    <section aria-label="HeyGen" className="card xl:sticky xl:top-6">
      <h2 className="text-lg font-bold">HeyGen</h2>
      <a href={HEYGEN_URL} target="_blank" rel="noopener noreferrer" className="mt-3 block overflow-hidden rounded-md border border-ink/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/heygen-home.jpg" alt="หน้าแรก HeyGen" width={1328} height={620} className="h-auto w-full" />
      </a>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <a href={HEYGEN_URL} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand underline">
          <T th="เปิดเว็บ HeyGen (app.heygen.com)" en="Open HeyGen (app.heygen.com)" zh="打开 HeyGen (app.heygen.com)" />
        </a>
        <button type="button" onClick={openSide} className="text-sm underline">
          <T th="เปิดข้างจอ" en="Open side-by-side" zh="并排打开" />
        </button>
      </div>
    </section>
  )
}
