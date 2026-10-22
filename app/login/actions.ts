'use server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
export async function signIn(fd: FormData) {
  const { error } = await createClient().auth.signInWithPassword({ email: String(fd.get('email')), password: String(fd.get('password')) })
  if (error) redirect('/login?error=' + encodeURIComponent('อีเมลหรือรหัสผ่านไม่ถูกต้อง'))
  redirect('/app/dashboard')
}
export async function signUp(fd: FormData) {
  const { data, error } = await createClient().auth.signUp({
    email: String(fd.get('email')), password: String(fd.get('password')),
    options: { data: { shop_name: String(fd.get('shop') || ''), ref_code: cookies().get('ref')?.value ?? '' } },
  })
  if (error) redirect('/login?mode=register&error=' + encodeURIComponent(error.message))
  if (!data.session) redirect('/login?error=' + encodeURIComponent('ตรวจอีเมลเพื่อยืนยันบัญชี แล้วเข้าสู่ระบบ'))
  redirect('/app/dashboard')
}
export async function signOut() {
  await createClient().auth.signOut()
  redirect('/login')
}
