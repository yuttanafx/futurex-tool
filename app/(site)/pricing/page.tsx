import Link from 'next/link'
import { T } from '@/components/Prefs'
import { createClient } from '@/lib/supabase/server'
import { METHODS, METHOD_SHORT, allowed, amountOf, fmtAmount, normPrice, type Price } from '@/lib/billing'
import type { Tx } from '@/lib/i18n'
export const metadata = { title: 'แพ็กเกจ · AI FutureX Tool' }
export const dynamic = 'force-dynamic'
const q = (n: string): Tx => ({ th: `${n} ข้อความ AI ต่อวัน`, en: `${n} AI messages per day`, zh: `每天 ${n} 条 AI 消息` })
const QUOTA: Record<string, Tx> = { free: q('30'), starter: q('200'), pro: q('1,000'), business: q('5,000') }
const FREE: Tx = { th: 'ฟรี', en: 'Free', zh: '免费' }
const ASK: Tx = { th: 'ติดต่อสอบถาม', en: 'Contact us', zh: '请咨询' }
const PER: Tx = { th: '/ เดือน', en: '/ month', zh: '/ 月' }

function Prices({ p }: { p?: Price }) {
  const ms = p ? METHODS.filter((m) => allowed(p, m) && amountOf(p, m) > 0) : []
  if (!ms.length) return <p className="mt-2 text-lg"><T {...ASK} /></p>
  return (
    <ul className="mt-2 space-y-0.5">
      {ms.map((m, i) => <li key={m} className={i === 0 ? 'text-lg font-bold' : 'text-sm text-ink/80'}>{fmtAmount(amountOf(p!, m), m)} {i === 0 && <span className="text-xs font-normal text-ink/60"><T {...PER} /></span>}</li>)}
    </ul>
  )
}

export default async function Pricing() {
  const { data } = await createClient().from('billing_prices').select('*').eq('active', true).order('sort')
  const prices = (data ?? []).map(normPrice)
  const by = (c: string) => prices.find((p) => p.code === c)
  const site = by('site'), user = by('user')
  const extra = [site && ['ค่าบริการเว็บไซต์', site], user && ['ค่ายูสเซอร์เพิ่ม (ต่อคน)', user]].filter(Boolean) as [string, Price][]
  const hasAny = prices.some((p) => p.kind === 'plan' && METHODS.some((m) => allowed(p, m) && amountOf(p, m) > 0))
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold"><T th="แพ็กเกจสมาชิก" en="Membership plans" zh="会员套餐" /></h1>
      <p className="mt-2 text-sm text-ink/60">{hasAny
        ? <T th="ราคารายเดือน ชำระได้ตามช่องทางที่ระบุในแต่ละแพ็กเกจ (บาท / PV / วอลเล็ต)" en="Monthly prices. Pay with the methods listed on each plan (THB / PV / Wallet)." zh="按月计价，可使用各套餐所列的支付方式（泰铢 / PV / 钱包）。" />
        : <T th="โควตาตามที่ตั้งไว้ในระบบ ราคาจริงยังไม่ประกาศ" en="Quotas as configured in the system. Final pricing has not been announced." zh="额度按系统设置，正式价格尚未公布。" />}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="card"><h2 className="font-bold">Free</h2><p className="mt-2 text-lg"><T {...FREE} /></p><p className="mt-2 text-sm text-ink/70"><T {...QUOTA.free} /></p></div>
        {(['starter', 'pro', 'business'] as const).map((id) => {
          const p = by(`plan_${id}`)
          return (
            <div key={id} className={`card ${p?.recommended ? 'ring-2 ring-brand' : ''}`}>
              <h2 className="flex items-center justify-between gap-2 font-bold capitalize">{p?.label ?? id}{p?.recommended && <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">⭐ <T th="แนะนำ" en="Popular" zh="推荐" /></span>}</h2>
              <Prices p={p} />
              <p className="mt-2 text-sm text-ink/70"><T {...QUOTA[id]} /></p>
            </div>
          )
        })}
      </div>
      {extra.some(([, p]) => METHODS.some((m) => allowed(p, m) && amountOf(p, m) > 0)) && (
        <div className="card mt-6">
          <h2 className="font-bold"><T th="ค่าบริการเพิ่มเติมรายเดือน" en="Additional monthly fees" zh="每月附加费用" /></h2>
          <ul className="mt-3 space-y-2 text-sm">
            {extra.map(([label, p]) => (
              <li key={p.code} className="flex flex-wrap justify-between gap-2"><span>{label}</span>
                <span>{METHODS.filter((m) => allowed(p, m) && amountOf(p, m) > 0).map((m) => fmtAmount(amountOf(p, m), m)).join(' · ') || '-'}</span></li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink/50">{METHODS.map((m) => METHOD_SHORT[m]).join(' / ')}</p>
        </div>
      )}
      <Link href="/register" className="btn mt-8"><T th="เริ่มใช้ฟรี" en="Start free" zh="免费开始" /></Link>
    </main>
  )
}
