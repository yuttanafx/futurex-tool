import Link from 'next/link'
import { getContext } from '@/lib/tenant'
import VideoEmbed from '@/components/VideoEmbed'
import { T } from '@/components/Prefs'
export const dynamic = 'force-dynamic'

export default async function Manual() {
  const { sb } = await getContext()
  const [{ data }, { data: isAdmin }] = await Promise.all([
    sb.from('manual_videos').select('id,title,description,video_url').order('sort_order').order('created_at'),
    sb.rpc('is_platform_admin'),
  ])
  const list = data ?? []
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold"><T th="คู่มือการใช้งาน" en="User guide" zh="使用手册" /></h1>
        {isAdmin === true && <Link href="/admin/manual" className="btn-ghost"><T th="จัดการวิดีโอ (แอดมิน)" en="Manage videos (admin)" zh="管理视频（管理员）" /></Link>}
      </div>
      <p className="mt-2 text-sm text-ink/70"><T th="ดูวิดีโอสอนใช้งานทีละหัวข้อ เรียงตามลำดับ" en="Watch the tutorials one topic at a time, in order." zh="按顺序逐个观看使用教程。" /></p>
      {!list.length && <p className="card mt-6 text-sm text-ink/70"><T th="ยังไม่มีวิดีโอ แอดมินกำลังเตรียมเนื้อหา โปรดกลับมาดูใหม่เร็วๆ นี้" en="No videos yet. Please check back soon." zh="暂无视频，请稍后再来。" /></p>}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {list.map((v, i) => (
          <section key={v.id} className="card">
            <VideoEmbed url={v.video_url} title={v.title} />
            <h2 className="mt-3 font-bold"><span className="mr-2 text-ink/50">{i + 1}.</span>{v.title}</h2>
            {v.description && <p className="mt-1 text-sm text-ink/70">{v.description}</p>}
          </section>
        ))}
      </div>
    </>
  )
}
