import { T } from '@/components/Prefs'

const SRC = (process.env.NEXT_PUBLIC_ADPILOT_URL || 'https://ai-adpilot-seven.vercel.app') + '/login#queue'

export default function AdContent() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          <T th="ยิงแอด คอนเทนต์" en="Ad Content" zh="广告内容" />
        </h1>
        <a href={SRC} target="_blank" rel="noopener noreferrer" className="btn-ghost">
          <T th="เปิดในแท็บใหม่ ↗" en="Open in new tab ↗" zh="在新标签页打开 ↗" />
        </a>
      </div>
      <p className="mt-2 text-xs text-ink/60">
        <T
          th="ล็อกอินด้วยบัญชี AdPilot ในกรอบนี้ได้เลย ถ้าเข้าไม่ได้ (เช่น Safari / iPhone) ให้กด “เปิดในแท็บใหม่”"
          en="Log in with your AdPilot account right here. If it won't sign in (e.g. Safari / iPhone), use “Open in new tab”."
          zh="可直接在此框内使用 AdPilot 账号登录。若无法登录（如 Safari / iPhone），请点“在新标签页打开”。"
        />
      </p>
      <iframe
        src={SRC}
        title="AdPilot"
        className="mt-4 block w-full rounded-xl border border-ink/10 bg-white"
        style={{ height: 'calc(100vh - 7.5rem)', minHeight: 560 }}
        allow="clipboard-write; clipboard-read; fullscreen"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </>
  )
}
