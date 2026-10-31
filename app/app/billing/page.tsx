import Link from 'next/link'
import { getContext } from '@/lib/tenant'
import { admin } from '@/lib/supabase/admin'
import {
  METHOD_LABEL, MONTH_CHOICES, INVOICE_STATUS, amountOf, commonMethods, fmtAmount, priceText, normPrice, dt, dtm, type Method, type Price,
} from '@/lib/billing'
import { baht } from '@/lib/fmt'
import { pay, topup, cancelInvoice } from './actions'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'ค่าบริการ & กระเป๋าเงิน' }

export default async function Billing({ searchParams }: { searchParams: { ok?: string; err?: string } }) {
  const { sb, tenant, role } = await getContext()
  const canPay = ['owner', 'admin'].includes(role)
  const [{ data: t }, { data: tb }, { data: pr }, { data: inv }, { data: led }, { data: pub }, { count: users }] = await Promise.all([
    sb.from('tenants').select('plan_id').eq('id', tenant.id).single(),
    sb.from('tenant_billing').select('wallet,pv,paid_until').eq('tenant_id', tenant.id).maybeSingle(),
    sb.from('billing_prices').select('*').eq('active', true).order('sort'),
    sb.from('billing_invoices').select('id,invoice_no,kind,method,plan_id,months,amount,status,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(10),
    sb.from('billing_ledger').select('id,unit,amount,balance_after,reason,created_at').eq('tenant_id', tenant.id).order('created_at', { ascending: false }).limit(10),
    sb.rpc('billing_public'),
    admin().from('tenant_members').select('*', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
  ])
  const prices = (pr ?? []).map(normPrice)
  const byCode = (c: string) => prices.find((p) => p.code === c)
  const included = Number((pub as any)?.user_included ?? 1)
  const extra = Math.max((users ?? 1) - included, 0)
  const plan = t?.plan_id ?? 'free'
  const wallet = Number(tb?.wallet ?? 0), pv = Number(tb?.pv ?? 0)
  const left = tb?.paid_until ? Math.ceil((new Date(tb.paid_until).getTime() - Date.now()) / 864e5) : null

  // การ์ดแพ็กเกจ: รายการที่ต้องจ่าย = ค่าเว็บ + ค่ายูสเซอร์ที่เกิน + ค่าแพ็กเกจ (ไม่รวมรายการที่ qty = 0)
  const cards = (['free', 'starter', 'pro', 'business'] as const).map((id) => {
    const items: [Price, number][] = []
    for (const code of ['site', 'user', `plan_${id}`]) {
      const p = byCode(code)
      if (!p) continue
      const qty = code === 'user' ? extra : 1
      if (qty > 0) items.push([p, qty])
    }
    const methods = commonMethods(items.map(([p]) => p))
      .map((m) => ({ m, total: items.reduce((a, [p, q]) => a + amountOf(p, m) * q, 0) }))
      .filter((x) => x.total > 0)
    return { id, items, methods, plan: byCode(`plan_${id}`) }
  }).filter((c) => c.id !== 'free' ? !!c.plan : c.methods.length > 0)

  return (
    <>
      <p className="text-xs text-ink/60">WORKSPACE / BILLING</p>
      <h1 className="text-2xl font-bold">ค่าบริการ &amp; กระเป๋าเงิน</h1>
      {searchParams.ok === 'paid' && <p role="status" className="mt-4 rounded-md bg-brand/10 p-3 text-sm">ชำระค่าบริการแล้ว ต่ออายุเรียบร้อย</p>}
      {searchParams.ok === 'cancelled' && <p role="status" className="mt-4 rounded-md bg-brand/10 p-3 text-sm">ยกเลิกใบแจ้งหนี้แล้ว</p>}
      {searchParams.err && <p role="alert" className="mt-4 rounded-md bg-sun/30 p-3 text-sm">{searchParams.err}</p>}

      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 [&>div]:card">
        <div><dt className="text-sm text-ink/60">แพ็กเกจ</dt><dd className="text-2xl font-bold capitalize">{plan}</dd></div>
        <div><dt className="text-sm text-ink/60">ใช้งานได้ถึง</dt><dd className="text-xl font-bold">{tb?.paid_until ? dt(tb.paid_until) : 'ยังไม่ได้ชำระ'}</dd>
          {left !== null && <dd className={`text-xs ${left < 0 ? 'text-red-700' : 'text-ink/60'}`}>{left < 0 ? `เกินกำหนด ${-left} วัน` : `เหลือ ${left} วัน`}</dd>}</div>
        <div><dt className="text-sm text-ink/60">วอลเล็ต</dt><dd className="text-2xl font-bold">{baht(wallet)}</dd></div>
        <div><dt className="text-sm text-ink/60">PV</dt><dd className="text-2xl font-bold">{new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(pv)}</dd></div>
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-bold">เลือกแพ็กเกจและวิธีชำระ</h2>
        <p className="mt-1 text-xs text-ink/60">
          ราคารายเดือนตามที่ระบบกำหนด · ค่ายูสเซอร์คิดเฉพาะยูสเซอร์ที่เกิน {included} คน (ตอนนี้ร้านมี {users ?? 1} คน → คิดเพิ่ม {extra} คน)
          {byCode('site') && <> · ค่าเว็บไซต์ {priceText(byCode('site')!)}</>}
        </p>
        {!canPay && <p className="mt-3 rounded-md bg-sun/20 p-3 text-sm">เฉพาะเจ้าของร้าน/แอดมินร้านที่ชำระค่าบริการได้</p>}
        {!cards.length && <p className="mt-4 text-sm text-ink/60">ตอนนี้ยังไม่มีรายการค่าบริการที่ต้องชำระ</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {cards.map((c) => (
            <form key={c.id} action={pay} className={`card space-y-3 ${c.plan?.recommended ? 'ring-2 ring-brand' : ''}`}>
              <input type="hidden" name="plan" value={c.id} />
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold capitalize">{c.id === 'free' ? 'ค่าเว็บไซต์ (แพ็กเกจฟรี)' : c.plan!.label}</h3>
                <span className="flex gap-1 text-xs">
                  {c.plan?.recommended && <span className="rounded-full bg-brand px-2 py-0.5 text-white">⭐ แนะนำ</span>}
                  {c.id === plan && <span className="rounded-full bg-white/10 px-2 py-0.5">แพ็กเกจปัจจุบัน</span>}
                </span>
              </div>
              <ul className="space-y-1 text-sm text-ink/80">
                {c.items.map(([p, q]) => <li key={p.code} className="flex justify-between gap-2"><span>{p.kind === 'user' ? `${p.label} × ${q}` : p.label}</span><span className="text-right">{priceText(p)}</span></li>)}
              </ul>
              {c.methods.length ? (
                <>
                  <label className="block text-sm">จำนวนเดือน
                    <select name="months" className="input mt-1" defaultValue="1">{MONTH_CHOICES.map((m) => <option key={m} value={m}>{m} เดือน</option>)}</select></label>
                  <div className="space-y-2">
                    {c.methods.map(({ m, total }) => {
                      const short = (m === 'wallet' && wallet < total) || (m === 'pv' && pv < total)
                      return (
                        <button key={m} name="method" value={m} disabled={!canPay} className={`${m === 'thb' ? 'btn' : 'btn-ghost'} w-full justify-center ${short ? 'opacity-60' : ''}`}>
                          จ่ายด้วย{METHOD_LABEL[m]} · {fmtAmount(total, m)}/เดือน{short ? ' (ยอดไม่พอสำหรับ 1 เดือน)' : ''}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : <p className="rounded-md bg-sun/20 p-3 text-xs">แพ็กเกจนี้ยังไม่มีวิธีชำระที่ใช้ได้กับทุกรายการ ติดต่อผู้ดูแลระบบ</p>}
            </form>
          ))}
        </div>
      </section>

      <section className="card mt-8 max-w-xl">
        <h2 className="font-bold">เติมวอลเล็ต</h2>
        <p className="mt-1 text-xs text-ink/60">โอน/พร้อมเพย์แล้วแนบสลิป ผู้ดูแลตรวจสอบแล้วยอดจะเข้าวอลเล็ต · PV ได้รับจากผู้ดูแลระบบ</p>
        <form action={topup} className="mt-3 flex gap-2">
          <input name="amount" type="number" min="1" max="1000000" step="0.01" required placeholder="จำนวนเงิน (บาท)" aria-label="จำนวนเงินที่เติม" className="input" />
          <button className="btn" disabled={!canPay}>เติมเงิน</button>
        </form>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="font-bold">ใบแจ้งหนี้ล่าสุด</h2>
          <ul className="mt-3 divide-y divide-ink/10 text-sm">
            {!inv?.length && <li className="py-3 text-ink/60">ยังไม่มีรายการ</li>}
            {inv?.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span><Link href={`/app/billing/invoice/${i.id}`} className="underline">#{i.invoice_no}</Link> · {i.kind === 'topup' ? 'เติมวอลเล็ต' : `แพ็กเกจ ${i.plan_id} ${i.months} เดือน`} · {INVOICE_STATUS[i.status]}
                  <span className="block text-xs text-ink/50">{dtm(i.created_at)}</span></span>
                <span className="flex items-center gap-2">{fmtAmount(Number(i.amount), i.method as Method)}
                  {i.status === 'pending' && canPay && <form action={cancelInvoice}><input type="hidden" name="id" value={i.id} /><button className="text-xs underline">ยกเลิก</button></form>}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-bold">ความเคลื่อนไหววอลเล็ต / PV</h2>
          <ul className="mt-3 divide-y divide-ink/10 text-sm">
            {!led?.length && <li className="py-3 text-ink/60">ยังไม่มีรายการ</li>}
            {led?.map((l) => (
              <li key={l.id} className="flex justify-between gap-2 py-2">
                <span>{l.reason}<span className="block text-xs text-ink/50">{dtm(l.created_at)}</span></span>
                <span className={Number(l.amount) < 0 ? 'text-red-700' : 'text-brand'}>{Number(l.amount) > 0 ? '+' : ''}{fmtAmount(Number(l.amount), l.unit as Method)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
