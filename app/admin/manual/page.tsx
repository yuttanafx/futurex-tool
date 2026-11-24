import { createClient } from '@/lib/supabase/server'
import VideoEmbed from '@/components/VideoEmbed'
import { addVideo, updateVideo, deleteVideo, moveVideo } from './actions'
export const dynamic = 'force-dynamic'

export default async function AdminManual() {
  const sb = createClient()
  const { data } = await sb.from('manual_videos').select('id,title,description,video_url').order('sort_order').order('created_at')
  const list = data ?? []
  return (
    <>
      <p className="text-xs text-ink/60">PLATFORM / USER GUIDE</p>
      <h1 className="text-2xl font-bold">จัดการวิดีโอคู่มือการใช้งาน</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/70">วางลิงก์ YouTube (หรือ Vimeo / Google Drive / ไฟล์ .mp4) ลงในแต่ละช่อง สมาชิกจะเห็นเรียงตามลำดับที่หน้า “คู่มือการใช้งาน” ใช้ปุ่ม ↑ ↓ เพื่อสลับลำดับ ลิงก์ต้องขึ้นต้นด้วย https://</p>

      <form action={addVideo} className="card mt-6 space-y-3">
        <h2 className="font-bold">เพิ่มช่องวิดีโอใหม่</h2>
        <label className="block text-sm">ชื่อหัวข้อ<input name="title" required maxLength={120} className="input mt-1" placeholder="เช่น เริ่มต้นสร้างร้านใน 5 นาที" /></label>
        <label className="block text-sm">ลิงก์วิดีโอ<input name="video_url" type="url" maxLength={500} className="input mt-1" placeholder="https://youtu.be/..." /></label>
        <label className="block text-sm">คำอธิบายสั้นๆ (ไม่บังคับ)<textarea name="description" maxLength={500} rows={2} className="input mt-1" /></label>
        <button className="btn">เพิ่มช่อง</button>
      </form>

      <h2 className="mt-8 text-lg font-bold">ช่องทั้งหมด ({list.length})</h2>
      <div className="mt-4 space-y-4">
        {!list.length && <p className="text-sm text-ink/60">ยังไม่มีวิดีโอ เพิ่มช่องแรกด้านบนได้เลย</p>}
        {list.map((v, i) => (
          <section key={v.id} className="card grid gap-4 md:grid-cols-[minmax(0,18rem)_1fr]">
            <VideoEmbed url={v.video_url} title={v.title} />
            <div className="min-w-0">
              <p className="mb-2 text-xs text-ink/60">ช่องที่ {i + 1}</p>
              <form action={updateVideo} className="space-y-2">
                <input type="hidden" name="id" value={v.id} />
                <input name="title" defaultValue={v.title} required maxLength={120} className="input" aria-label="ชื่อหัวข้อ" />
                <input name="video_url" type="url" defaultValue={v.video_url} maxLength={500} className="input" aria-label="ลิงก์วิดีโอ" />
                <textarea name="description" defaultValue={v.description} maxLength={500} rows={2} className="input" aria-label="คำอธิบาย" />
                <button className="btn">บันทึก</button>
              </form>
              <div className="mt-3 flex flex-wrap gap-2">
                <form action={moveVideo}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="dir" value="up" /><button className="btn-ghost py-1" disabled={i === 0} aria-label="เลื่อนขึ้น">↑</button></form>
                <form action={moveVideo}><input type="hidden" name="id" value={v.id} /><input type="hidden" name="dir" value="down" /><button className="btn-ghost py-1" disabled={i === list.length - 1} aria-label="เลื่อนลง">↓</button></form>
                <form action={deleteVideo}><input type="hidden" name="id" value={v.id} /><button className="btn-ghost py-1 text-red-600">ลบช่องนี้</button></form>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
