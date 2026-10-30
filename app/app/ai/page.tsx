import Link from 'next/link'
import { T } from '@/components/Prefs'
import AiFrame from './AiFrame'

const SRC = process.env.NEXT_PUBLIC_AI_PLATFORM_URL || 'https://ai-platform-mlm.vercel.app/'

export default function AI() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          <T th="ผู้ช่วย AI" en="AI assistant" zh="AI 助手" />
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/ai-keys" className="btn-ghost">
            <T th="ตั้งค่า API ของ AI" en="AI API keys" zh="AI API 密钥" />
          </Link>
          <Link href="/app/ai/settings" className="btn-ghost">
            <T th="ตั้งค่าผู้ช่วยบนหน้าร้าน" en="Storefront assistant settings" zh="店铺助手设置" />
          </Link>
          <a href={SRC} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            <T th="เปิดในแท็บใหม่ ↗" en="Open in new tab ↗" zh="在新标签页打开 ↗" />
          </a>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink/60">
        <T
          th="ใช้งานผู้ช่วย AI ในกรอบนี้ได้เลย ถ้ากรอบว่างหรือเข้าไม่ได้ (เช่น Safari / iPhone) ให้กดปุ่มด้านบนกรอบเพื่อสลับเป็นลิงก์"
          en="Use the AI assistant right here. If the frame is blank or won't sign in (e.g. Safari / iPhone), use the button above the frame to switch to a link."
          zh="可直接在此框内使用 AI 助手。若框内空白或无法登录（如 Safari / iPhone），请点框上方按钮改用链接。"
        />
      </p>
      <AiFrame src={SRC} />
    </>
  )
}
