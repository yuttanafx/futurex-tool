import Link from 'next/link'
import { T } from '@/components/Prefs'
import type { Tx } from '@/lib/i18n'
export const metadata = { title: 'แพ็กเกจ · AI FutureX Tool' }
const FREE: Tx = { th: 'ฟรี', en: 'Free', zh: '免费' }
const ASK: Tx = { th: 'ติดต่อสอบถาม', en: 'Contact us', zh: '请咨询' }
const q = (n: string): Tx => ({ th: `${n} ข้อความ AI ต่อวัน`, en: `${n} AI messages per day`, zh: `每天 ${n} 条 AI 消息` })
const P: [string, Tx, Tx][] = [
  ['Free', FREE, q('30')],
  ['Starter', ASK, q('200')],
  ['Pro', ASK, q('1,000')],
  ['Business', ASK, q('5,000')],
]
export default function Pricing() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold"><T th="แพ็กเกจสมาชิก" en="Membership plans" zh="会员套餐" /></h1>
      <p className="mt-2 text-sm text-ink/60"><T th="โควตาตามที่ตั้งไว้ในระบบ ราคาจริงยังไม่ประกาศ" en="Quotas as configured in the system. Final pricing has not been announced." zh="额度按系统设置，正式价格尚未公布。" /></p>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {P.map(([n, price, quota]) => (
          <div key={n} className="card"><h2 className="font-bold">{n}</h2><p className="mt-2 text-lg"><T {...price} /></p><p className="mt-2 text-sm text-ink/70"><T {...quota} /></p></div>
        ))}
      </div>
      <Link href="/register" className="btn mt-8"><T th="เริ่มใช้ฟรี" en="Start free" zh="免费开始" /></Link>
    </main>
  )
}
