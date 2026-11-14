'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updatePassword(fd: FormData) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/forgot?error=' + encodeURIComponent('ลิงก์หมดอายุ กรุณาขอลิงก์ใหม่'))
  const password = String(fd.get('password') || '')
  const confirm = String(fd.get('confirm') || '')
  if (password.length < 8) redirect('/reset?error=' + encodeURIComponent('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'))
  if (password !== confirm) redirect('/reset?error=' + encodeURIComponent('รหัสผ่านทั้งสองช่องไม่ตรงกัน'))
  const { error } = await sb.auth.updateUser({ password })
  if (error) {
    console.error('updateUser(password) failed:', error.message)
    const same = /different from the old|same password/i.test(error.message)
    redirect('/reset?error=' + encodeURIComponent(same ? 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม' : 'เปลี่ยนรหัสผ่านไม่สำเร็จ ลองขอลิงก์ใหม่อีกครั้ง'))
  }
  await sb.auth.signOut()
  redirect('/login?ok=' + encodeURIComponent('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่'))
}
