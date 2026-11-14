import Link from 'next/link'
import { requestReset } from './actions'
import MarketingBackground from '@/components/MarketingBackground'
import { Controls, T } from '@/components/Prefs'
import Copyright from '@/components/Copyright'
export const metadata = { title: 'ลืมรหัสผ่าน · AI FutureX Tool' }
export default function Forgot({ searchParams }: { searchParams: { sent?: string; error?: string } }) {
  return (
    <div className="dk"><MarketingBackground />
      <div className="mx-auto flex max-w-sm justify-end px-6 pt-6"><Controls /></div>
      <main className="mx-auto max-w-sm px-6 py-14">
        <h1 className="text-2xl font-bold"><T th="ลืมรหัสผ่าน" en="Forgot password" zh="忘记密码" /></h1>
        {searchParams.error && <p role="alert" className="mt-4 rounded-md bg-sun/30 p-3 text-sm">{searchParams.error}</p>}
        {searchParams.sent ? (
          <p role="status" className="mt-6 rounded-md bg-brand/20 p-3 text-sm">
            <T
              th="หากอีเมลนี้มีบัญชีอยู่ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว กรุณาตรวจกล่องจดหมาย (และโฟลเดอร์สแปม) ลิงก์ใช้ได้ครั้งเดียวและมีอายุจำกัด"
              en="If an account exists for this email, we've sent a link to set a new password. Check your inbox (and spam folder). The link works once and expires soon."
              zh="如果该邮箱已注册，我们已发送设置新密码的链接。请检查收件箱（及垃圾邮件）。链接仅可使用一次，且很快过期。"
            />
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-ink/70"><T th="กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้" en="Enter your sign-up email and we'll send you a link to set a new password." zh="输入注册邮箱，我们将发送设置新密码的链接。" /></p>
            <form action={requestReset} className="mt-6 space-y-4">
              <label className="block text-sm"><T th="อีเมล" en="Email" zh="邮箱" /><input name="email" type="email" required autoComplete="email" className="input mt-1" /></label>
              <button className="btn w-full justify-center"><T th="ส่งลิงก์ตั้งรหัสผ่านใหม่" en="Send reset link" zh="发送重置链接" /></button>
            </form>
          </>
        )}
        <p className="mt-6 text-sm text-ink/70"><Link className="underline" href="/login"><T th="← กลับไปเข้าสู่ระบบ" en="← Back to log in" zh="← 返回登录" /></Link></p>
      </main>
      <Copyright className="pb-8 text-center text-xs text-ink/50" />
    </div>
  )
}
