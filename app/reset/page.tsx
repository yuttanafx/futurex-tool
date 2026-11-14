import Link from 'next/link'
import { redirect } from 'next/navigation'
import { updatePassword } from './actions'
import { createClient } from '@/lib/supabase/server'
import MarketingBackground from '@/components/MarketingBackground'
import { Controls, T } from '@/components/Prefs'
import Copyright from '@/components/Copyright'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'ตั้งรหัสผ่านใหม่ · AI FutureX Tool' }
export default async function Reset({ searchParams }: { searchParams: { error?: string } }) {
  // ต้องมาจากลิงก์ในอีเมล (มีเซสชันกู้รหัสผ่าน) ไม่งั้นส่งไปขอลิงก์ใหม่
  const { data: { user } } = await createClient().auth.getUser()
  if (!user) redirect('/forgot?error=' + encodeURIComponent('ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่'))
  return (
    <div className="dk"><MarketingBackground />
      <div className="mx-auto flex max-w-sm justify-end px-6 pt-6"><Controls /></div>
      <main className="mx-auto max-w-sm px-6 py-14">
        <h1 className="text-2xl font-bold"><T th="ตั้งรหัสผ่านใหม่" en="Set a new password" zh="设置新密码" /></h1>
        {searchParams.error && <p role="alert" className="mt-4 rounded-md bg-sun/30 p-3 text-sm">{searchParams.error}</p>}
        <form action={updatePassword} className="mt-6 space-y-4">
          <label className="block text-sm"><T th="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)" en="New password (min. 8 characters)" zh="新密码（至少 8 位）" /><input name="password" type="password" minLength={8} required autoComplete="new-password" className="input mt-1" /></label>
          <label className="block text-sm"><T th="ยืนยันรหัสผ่านใหม่" en="Confirm new password" zh="确认新密码" /><input name="confirm" type="password" minLength={8} required autoComplete="new-password" className="input mt-1" /></label>
          <button className="btn w-full justify-center"><T th="บันทึกรหัสผ่านใหม่" en="Save new password" zh="保存新密码" /></button>
        </form>
        <p className="mt-6 text-sm text-ink/70"><Link className="underline" href="/login"><T th="← กลับไปเข้าสู่ระบบ" en="← Back to log in" zh="← 返回登录" /></Link></p>
      </main>
      <Copyright className="pb-8 text-center text-xs text-ink/50" />
    </div>
  )
}
