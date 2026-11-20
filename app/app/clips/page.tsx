import { T } from '@/components/Prefs'
import FeatureGuide from '@/components/FeatureGuide'
import { GUIDE } from '@/lib/guide'
import ClipsFrame from './ClipsFrame'

// ตั้งค่า URL ได้ที่ env NEXT_PUBLIC_CLIPS_URL (ไม่ตั้ง = ใช้ค่าด้านล่าง)
const SRC = process.env.NEXT_PUBLIC_CLIPS_URL || 'https://clips.futurex-tool.online'

export default function Clips() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          <T th="รวมคลิปตั้งเวลาโพส" en="Clips & Scheduled Posts" zh="视频合集·定时发布" />
        </h1>
        <a href={SRC} target="_blank" rel="noopener noreferrer" className="btn">
          <T th="เปิดในแท็บใหม่ ↗" en="Open in new tab ↗" zh="在新标签页打开 ↗" />
        </a>
      </div>
      <p className="mt-2 text-xs text-ink/60">
        <T
          th="ใช้งานรวมคลิปตั้งเวลาโพสในกรอบนี้ได้เลย ถ้ากรอบว่างหรือเข้าไม่ได้ (เช่น Safari / iPhone) ให้กดปุ่มด้านบนกรอบเพื่อสลับเป็นลิงก์ หรือกด “เปิดในแท็บใหม่” ด้านบน"
          en="Use Clips & Scheduled Posts right here. If the frame is blank or won't sign in (e.g. Safari / iPhone), use the button above the frame to switch to a link, or press “Open in new tab” above."
          zh="可直接在此框内使用视频合集·定时发布。若框内空白或无法登录（如 Safari / iPhone），请点框上方按钮改用链接，或点上方“在新标签页打开”。"
        />
      </p>
      <ClipsFrame src={SRC} />

      <section className="mt-8 border-t border-ink/10 pt-6">
        <h2 className="text-sm font-bold text-ink/70">
          <T th="ความหมายของปุ่มนี้" en="What this button means" zh="此按钮的含义" />
        </h2>
        <div className="mt-3 max-w-sm">
          <FeatureGuide items={GUIDE} mode="app" only="/app/clips" />
        </div>
      </section>
    </>
  )
}
