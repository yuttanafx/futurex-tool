'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const UUID = /^[0-9a-f-]{36}$/i

// สิทธิ์จริงอยู่ที่ RLS ในฐานข้อมูล (is_platform_admin) ตรงนี้ตรวจซ้ำอีกชั้นเท่านั้น
async function adminClient() {
  const sb = createClient()
  const { data: ok } = await sb.rpc('is_platform_admin')
  return ok === true ? sb : null
}
const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().slice(0, max)
function cleanUrl(v: FormDataEntryValue | null): string | null {
  const s = clean(v, 500)
  if (!s) return ''
  try { return new URL(s).protocol === 'https:' ? s : null } catch { return null }
}
function done() { revalidatePath('/admin/manual'); revalidatePath('/app/manual') }

export async function addVideo(fd: FormData) {
  const sb = await adminClient(); if (!sb) return
  const title = clean(fd.get('title'), 120), url = cleanUrl(fd.get('video_url'))
  if (!title || url === null) return
  const { data: last } = await sb.from('manual_videos').select('sort_order').order('sort_order', { ascending: false }).limit(1).maybeSingle()
  const { error } = await sb.from('manual_videos').insert({ title, description: clean(fd.get('description'), 500), video_url: url, sort_order: (last?.sort_order ?? 0) + 10 })
  if (error) console.error('addVideo failed:', error.message)
  done()
}

export async function updateVideo(fd: FormData) {
  const sb = await adminClient(); if (!sb) return
  const id = clean(fd.get('id'), 40), title = clean(fd.get('title'), 120), url = cleanUrl(fd.get('video_url'))
  if (!UUID.test(id) || !title || url === null) return
  const { error } = await sb.from('manual_videos').update({ title, description: clean(fd.get('description'), 500), video_url: url, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) console.error('updateVideo failed:', error.message)
  done()
}

export async function deleteVideo(fd: FormData) {
  const sb = await adminClient(); if (!sb) return
  const id = clean(fd.get('id'), 40)
  if (!UUID.test(id)) return
  const { error } = await sb.from('manual_videos').delete().eq('id', id)
  if (error) console.error('deleteVideo failed:', error.message)
  done()
}

// สลับลำดับกับช่องข้างบน/ล่าง แล้วเรียงเลขใหม่เป็น 10, 20, 30...
export async function moveVideo(fd: FormData) {
  const sb = await adminClient(); if (!sb) return
  const id = clean(fd.get('id'), 40), dir = clean(fd.get('dir'), 4)
  if (!UUID.test(id) || (dir !== 'up' && dir !== 'down')) return
  const { data } = await sb.from('manual_videos').select('id').order('sort_order').order('created_at')
  const ids = (data ?? []).map((r) => r.id as string)
  const i = ids.indexOf(id), j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= ids.length) return
  ;[ids[i], ids[j]] = [ids[j], ids[i]]
  const res = await Promise.all(ids.map((x, k) => sb.from('manual_videos').update({ sort_order: (k + 1) * 10 }).eq('id', x)))
  const bad = res.find((r) => r.error)
  if (bad?.error) console.error('moveVideo failed:', bad.error.message)
  done()
}
