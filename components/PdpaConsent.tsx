'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { T } from '@/components/Prefs'

export const PDPA_COOKIE = 'pdpa_consent'
export const PDPA_VERSION = '1' // เปลี่ยนเลขนี้เมื่อแก้นโยบาย เพื่อให้ผู้ใช้ทุกคนต้องกดยอมรับใหม่
const OPEN_EVENT = 'pdpa:open'

const read = () => {
  const m = document.cookie.match(new RegExp(`(?:^|; )${PDPA_COOKIE}=([^;]*)`))
  if (!m) return null
  const [ver, choice] = decodeURIComponent(m[1]).split('|')
  return ver === PDPA_VERSION ? choice : null
}
const save = (choice: 'all' | 'necessary') => {
  document.cookie = `${PDPA_COOKIE}=${encodeURIComponent(`${PDPA_VERSION}|${choice}`)}; path=/; max-age=31536000; samesite=lax`
}

/** ปุ่มเปิดหน้าต่างความยินยอมอีกครั้ง (ใส่ใน footer) */
export function ConsentSettingsButton({ className = '' }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      <T th="ตั้งค่าความเป็นส่วนตัว" en="Privacy settings" zh="隐私设置" />
    </button>
  )
}

export default function PdpaConsent() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  const onPolicy = path === '/privacy'

  useEffect(() => {
    if (!read()) setOpen(true)
    const h = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, h)
    return () => window.removeEventListener(OPEN_EVENT, h)
  }, [])

  // ล็อกการเลื่อนหน้าเว็บขณะป๊อปอัปแสดง
  useEffect(() => {
    if (!open || onPolicy) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open, onPolicy])

  if (!open || onPolicy) return null
  const choose = (c: 'all' | 'necessary') => { save(c); setOpen(false) }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="pdpa-title" aria-describedby="pdpa-desc"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 p-6 shadow-2xl"
        style={{ background: '#16224a', color: '#e2e8ff' }}>
        <h2 id="pdpa-title" className="text-lg font-bold">
          🔒 <T th="เราให้ความสำคัญกับข้อมูลส่วนบุคคลของคุณ" en="We value your personal data" zh="我们重视您的个人数据" />
        </h2>
        <div id="pdpa-desc" className="mt-3 space-y-3 text-sm leading-relaxed" style={{ color: '#c7d0f0' }}>
          <p>
            <T
              th="เว็บไซต์นี้เก็บและใช้ข้อมูลส่วนบุคคลของคุณตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) เช่น อีเมล ชื่อ เบอร์โทร ที่อยู่จัดส่ง เพื่อให้บริการ จัดการคำสั่งซื้อ และรักษาความปลอดภัยของระบบ"
              en="This website collects and uses your personal data under Thailand's Personal Data Protection Act B.E. 2562 (PDPA), such as email, name, phone number and delivery address, to provide the service, process orders and keep the system secure."
              zh="本网站依据泰国《个人数据保护法》（PDPA，佛历2562年）收集和使用您的个人数据，例如邮箱、姓名、电话和收货地址，用于提供服务、处理订单和保障系统安全。" />
          </p>
          <p>
            <T
              th="เราใช้คุกกี้และที่เก็บข้อมูลในเบราว์เซอร์ที่จำเป็น (การเข้าสู่ระบบ ตะกร้าสินค้า ภาษา และธีม) คุณมีสิทธิ์เข้าถึง แก้ไข ลบ และเพิกถอนความยินยอมได้ทุกเมื่อ"
              en="We use necessary cookies and browser storage (login, shopping cart, language and theme). You may access, correct, delete your data and withdraw consent at any time."
              zh="我们使用必要的 Cookie 和浏览器存储（登录、购物车、语言和主题）。您可随时访问、更正、删除数据并撤回同意。" />
          </p>
          <p>
            <Link href="/privacy" className="underline" style={{ color: '#7CA2FF' }}>
              <T th="อ่านนโยบายความเป็นส่วนตัวฉบับเต็ม" en="Read the full Privacy Policy" zh="阅读完整隐私政策" />
            </Link>
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button type="button" autoFocus onClick={() => choose('all')}
            className="inline-flex flex-1 items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110"
            style={{ background: '#2F5BFF' }}>
            <T th="ยอมรับ" en="Accept" zh="接受" />
          </button>
          <button type="button" onClick={() => choose('necessary')}
            className="inline-flex flex-1 items-center justify-center rounded-md border border-white/25 px-4 py-2.5 text-sm font-medium hover:bg-white/10">
            <T th="ยอมรับเฉพาะที่จำเป็น" en="Necessary only" zh="仅接受必要项" />
          </button>
        </div>
      </div>
    </div>
  )
}
