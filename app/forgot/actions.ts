'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { limited } from '@/lib/ratelimit'
import { siteOrigin } from '@/lib/site'

// ขอลิงก์ตั้งรหัสผ่านใหม่ทางอีเมล · ตอบข้อความเดียวกันไม่ว่าอีเมลนี้มีบัญชีหรือไม่ (กันคนไล่เดาอีเมลสมาชิก)
export async function requestReset(fd: FormData) {
  const email = String(fd.get('email') || '').trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect('/forgot?error=' + encodeURIComponent('รูปแบบอีเมลไม่ถูกต้อง'))
  // กันถูกใช้ยิงอีเมลรัว ๆ: ต่อ IP ไม่เกิน 5 ครั้งใน 15 นาที และต่ออีเมลไม่เกิน 3 ครั้งต่อชั่วโมง
  if ((await limited('forgot', 5, 900)) || (await limited(`forgot:${email}`, 3, 3600))) {
    redirect('/forgot?error=' + encodeURIComponent('ส่งคำขอถี่เกินไป กรุณารอสักครู่แล้วลองใหม่'))
  }
  const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${siteOrigin()}/auth/confirm` })
  if (error) {
    console.error('resetPasswordForEmail failed:', error.message)
    // โควตาส่งอีเมลของ Supabase เต็ม (ไม่เกี่ยวกับว่ามีบัญชีหรือไม่) แจ้งให้ทราบได้
    if (error.status === 429 || /rate limit/i.test(error.message)) {
      redirect('/forgot?error=' + encodeURIComponent('ระบบส่งอีเมลเต็มชั่วคราว กรุณาลองใหม่ภายหลัง หรือติดต่อผู้ดูแล'))
    }
  }
  redirect('/forgot?sent=1')
}
