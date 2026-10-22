import type { SupabaseClient } from '@supabase/supabase-js'
const OK: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
export const MAX_BYTES = 5 * 1024 * 1024
/** อัปโหลดรูปไป Supabase Storage คืนค่า URL สาธารณะ · ข้ามไฟล์ที่ไม่ใช่รูป/ใหญ่เกิน 5MB */
export async function uploadImages(sb: SupabaseClient, bucket: string, folder: string, files: FormDataEntryValue[], max = 8) {
  const urls: string[] = []
  for (const f of files.slice(0, max)) {
    if (typeof f === 'string' || !f.size || f.size > MAX_BYTES) continue
    const ext = OK[f.type]
    if (!ext) continue
    const path = `${folder}/${crypto.randomUUID()}.${ext}`
    const { error } = await sb.storage.from(bucket).upload(path, f, { contentType: f.type, cacheControl: '31536000' })
    if (error) { console.error('upload failed:', error.message); continue }
    urls.push(sb.storage.from(bucket).getPublicUrl(path).data.publicUrl)
  }
  return urls
}
