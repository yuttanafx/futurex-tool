import { T } from '@/components/Prefs'
import TiktokFrame from './TiktokFrame'

const SRC = process.env.NEXT_PUBLIC_TIKTOK_APP_URL || 'https://tiktok-app-7jro.vercel.app/login'

export default function Tiktok() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          <T th="TikTok App" en="TikTok App" zh="TikTok App" />
        </h1>
        <a href={SRC} target="_blank" rel="noopener noreferrer" className="btn-ghost">
          <T th="เปิดในแท็บใหม่ ↗" en="Open in new tab ↗" zh="在新标签页打开 ↗" />
        </a>
      </div>
      <p className="mt-2 text-xs text-ink/60">
        <T
          th="ล็อกอินและใช้งานในกรอบนี้ได้เลย ถ้ากรอบว่างหรือล็อกอินไม่ได้ (เช่น Safari / iPhone) ให้กดปุ่ม เปิดในแท็บใหม่ แล้วล็อกอินที่หน้านั้นแทน"
          en="Log in and use it right here. If the frame is blank or won't sign in (e.g. Safari / iPhone), press Open in new tab and sign in there instead."
          zh="可直接在此框内登录使用。若框内空白或无法登录（如 Safari / iPhone），请点「在新标签页打开」并在新页面登录。"
        />
      </p>
      <TiktokFrame src={SRC} />
    </>
  )
}
