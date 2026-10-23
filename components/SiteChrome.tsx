import Link from 'next/link'
import { Controls, T } from '@/components/Prefs'
import { ConsentSettingsButton } from '@/components/PdpaConsent'
export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="text-lg font-bold">AI FutureX Tool</Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm sm:gap-5">
          <Link href="/features" className="hidden md:inline"><T th="ฟังก์ชัน" en="Features" zh="功能" /></Link>
          <Link href="/pricing" className="hidden md:inline"><T th="แพ็กเกจ" en="Pricing" zh="套餐" /></Link>
          <Link href="/templates" className="hidden md:inline"><T th="ตัวอย่างเซลเพจ" en="Examples" zh="页面示例" /></Link>
          <Controls />
          <Link href="/login" className="underline"><T th="เข้าสู่ระบบ" en="Log in" zh="登录" /></Link>
          <Link href="/register" className="btn"><T th="สมัครฟรี" en="Sign up free" zh="免费注册" /></Link>
        </nav>
      </div>
    </header>
  )
}
export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-white py-8 text-center text-sm text-ink/60">
      © AI FutureX Tool · <T
        th="หนึ่งแพลตฟอร์ม หลายร้านค้า ข้อมูลแต่ละร้านแยกกันอย่างปลอดภัย"
        en="One platform, many shops. Each shop's data stays securely separated."
        zh="一个平台，多家店铺，各店数据安全隔离" />
      <div className="mt-3 flex justify-center gap-4">
        <Link href="/privacy" className="underline"><T th="นโยบายความเป็นส่วนตัว" en="Privacy Policy" zh="隐私政策" /></Link>
        <ConsentSettingsButton className="underline" />
      </div>
    </footer>
  )
}
