'use server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { admin } from '@/lib/supabase/admin'
export async function signIn(fd: FormData) {
  const { error } = await createClient().auth.signInWithPassword({ email: String(fd.get('email')), password: String(fd.get('password')) })
  if (error) redirect('/login?error=' + encodeURIComponent('อีเมลหรือรหัสผ่านไม่ถูกต้อง'))
  redirect('/app/dashboard')
}
export async function signUp(fd: FormData) {
  const email = String(fd.get('email')).trim()
  const password = String(fd.get('password'))
  const meta = { shop_name: String(fd.get('shop') || ''), ref_code: cookies().get('ref')?.value ?? '' }
  const sb = createClient()
  // มี SUPABASE_SERVICE_ROLE_KEY → สร้างบัญชีแบบยืนยันอีเมลให้เลย (ไม่ส่งอีเมล ไม่ติดโควตาอีเมลของ Supabase ไม่ต้องกดลิงก์) แล้วล็อกอินทันที
  // ไม่มีคีย์ → ใช้วิธีเดิม (ส่งอีเมลยืนยัน)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error } = await admin().auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta })
    if (error) {
      const dup = /already|registered|exists/i.test(error.message)
      redirect('/login?mode=register&error=' + encodeURIComponent(dup ? 'อีเมลนี้สมัครไว้แล้ว กรุณาเข้าสู่ระบบ' : error.message))
    }
    const { error: e2 } = await sb.auth.signInWithPassword({ email, password })
    if (e2) redirect('/login?error=' + encodeURIComponent('สมัครสำเร็จแล้ว กรุณาเข้าสู่ระบบ'))
    redirect('/app/dashboard')
  }
  const { data, error } = await sb.auth.signUp({ email, password, options: { data: meta } })
  if (error) redirect('/login?mode=register&error=' + encodeURIComponent(error.message))
  if (!data.session) redirect('/login?error=' + encodeURIComponent('ตรวจอีเมลเพื่อยืนยันบัญชี แล้วเข้าสู่ระบบ'))
  redirect('/app/dashboard')
}
export async function signOut() {
  await createClient().auth.signOut()
  redirect('/login')
}
