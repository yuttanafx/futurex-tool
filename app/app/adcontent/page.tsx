import { T } from '@/components/Prefs'

const SRC = 'https://ai-adpilot-seven.vercel.app/login#queue'

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
