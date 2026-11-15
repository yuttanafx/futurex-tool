'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
const UUID = /^[0-9a-f-]{36}$/i

// สิทธิ์ตรวจในฐานข้อมูล (is_platform_admin) ไม่ใช่แค่ซ่อนปุ่ม
export async function startManage(fd: FormData) {
  const id = String(fd.get('id') || '')
  if (!UUID.test(id)) return
  const { error } = await createClient().rpc('admin_impersonate_start', { p_tenant: id })
  if (error) { console.error('admin_impersonate_start failed:', error.message); return }
  redirect('/app/dashboard')
}

export async function stopManage() {
  await createClient().rpc('admin_impersonate_stop')
  redirect('/admin')
}
