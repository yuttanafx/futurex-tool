import Link from 'next/link'
import { signIn, signUp } from './actions'
import MarketingBackground from '@/components/MarketingBackground'
import { Controls, T } from '@/components/Prefs'
export default function Login({ searchParams }: { searchParams: { mode?: string; error?: string } }) {
  const reg = searchParams.mode === 'register'
  const title = reg ? <T th="สมัครสมาชิก" en="Sign up" zh="注册" /> : <T th="เข้าสู่ระบบ" en="Log in" zh="登录" />
  return (
    <div className="dk"><MarketingBackground />
      <div className="mx-auto flex max-w-sm justify-end px-6 pt-6"><Controls /></div>
      <main className="mx-auto max-w-sm px-6 py-14">
        <h1 className="text-2xl font-bold">{title}</h1>
        {searchParams.error && <p role="alert" className="mt-4 rounded-md bg-sun/30 p-3 text-sm">{searchParams.error}</p>}
        <form action={reg ? signUp : signIn} className="mt-6 space-y-4">
          {reg && <label className="block text-sm"><T th="ชื่อร้าน" en="Shop name" zh="店铺名称" /><input name="shop" required className="input mt-1" /></label>}
          <label className="block text-sm"><T th="อีเมล" en="Email" zh="邮箱" /><input name="email" type="email" required className="input mt-1" /></label>
          <label className="block text-sm"><T th="รหัสผ่าน" en="Password" zh="密码" /><input name="password" type="password" minLength={8} required className="input mt-1" /></label>
          <button className="btn w-full justify-center">{title}</button>
        </form>
        <p className="mt-6 text-sm text-ink/70">
          {reg
            ? <><T th="มีบัญชีแล้ว?" en="Already have an account?" zh="已有账号？" /> <Link className="underline" href="/login"><T th="เข้าสู่ระบบ" en="Log in" zh="登录" /></Link></>
            : <><T th="ยังไม่มีบัญชี?" en="No account yet?" zh="还没有账号？" /> <Link className="underline" href="/login?mode=register"><T th="สมัครสมาชิก" en="Sign up" zh="注册" /></Link></>}
        </p>
      </main>
    </div>
  )
}
