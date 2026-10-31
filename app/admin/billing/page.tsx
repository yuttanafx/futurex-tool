import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { METHODS, METHOD_LABEL, INVOICE_STATUS, fmtAmount, normPrice, dtm, type Method } from '@/lib/billing'
export const dynamic = 'force-dynamic'
export const metadata = { title: 'ตั้งค่าค่าบริการ · Admin' }
const n = (v: FormDataEntryValue | null) => { const x = Number(String(v ?? '0').trim() || 0); return Number.isFinite(x) && x >= 0 ? x : 0 }

async function savePrice(fd: FormData) {
  'use server'
  const { error } = await createClient().rpc('admin_save_price', {
    p_code: String(fd.get('code')), p_price_thb: n(fd.get('price_thb')), p_price_pv: n(fd.get('price_pv')), p_price_wallet: n(fd.get('price_wallet')),
    p_allow_thb: fd.get('allow_thb') === 'on', p_allow_pv: fd.get('allow_pv') === 'on', p_allow_wallet: fd.get('allow_wallet') === 'on',
    p_active: fd.get('active') === 'on', p_recommended: fd.get('recommended') === 'on',
  })
  if (error) console.error('admin_save_price failed:', error.message)
  revalidatePath('/admin/billing'); revalidatePath('/pricing')
}
async function saveSettings(fd: FormData) {
  'use server'
  const t = (k: string) => String(fd.get(k) || '').trim().slice(0, 120)
  const { error } = await createClient().rpc('admin_save_billing_settings', {
    p_promptpay: t('promptpay_id').replace(/\D/g, ''), p_bank_name: t('bank_name'), p_bank_account: t('bank_account'), p_bank_account_name: t('bank_account_name'),
    p_user_included: Math.floor(n(fd.get('user_included'))), p_grace_days: Math.floor(n(fd.get('grace_days'))),
  })
  if (error) console.error('admin_save_billing_settings failed:', error.message)
  revalidatePath('/admin/billing')
}
async function review(fd: FormData) {
  'use server'
  const { error } = await createClient().rpc('admin_review_invoice', { p_invoice: String(fd.get('id')), p_approve: fd.get('do') === 'approve', p_note: String(fd.get('note') || '').slice(0, 300) || null })
  if (error) console.error('admin_review_invoice failed:', error.message)
  revalidatePath('/admin/billing')
}

export default async function AdminBilling() {
  const sb = createClient()
  const [{ data: pr }, { data: st }, { data: pending }, { data: paid }, { data: shops }] = await Promise.all([
    sb.from('billing_prices').select('*').order('sort'),
    sb.from('billing_settings').select('*').eq('id', 1).maybeSingle(),
    sb.from('billing_invoices').select('*').eq('status', 'pending').not('slip_url', 'is', null).order('created_at'),
    sb.from('billing_invoices').select('id,invoice_no,tenant_id,kind,method,plan_id,months,amount,paid_at').eq('status', 'paid').order('paid_at', { ascending: false }).limit(15),
    sb.rpc('admin_shops'),
  ])
  const name = (id: string) => (shops as any[] | null)?.find((s) => s.id === id)?.name ?? id.slice(0, 8)
  const prices = (pr ?? []).map(normPrice)
  const waiting = (pending ?? []).length
  return (
    <>
      <p className="text-xs text-ink/60">PLATFORM / BILLING</p>
      <h1 className="text-2xl font-bold">ตั้งค่าค่าบริการ</h1>

      <section className="card mt-6">
        <h2 className="font-bold">รออนุมัติ ({waiting})</h2>
        <p className="text-xs text-ink/60">แสดงเฉพาะใบแจ้งหนี้โอนเงินที่ร้านแนบสลิปแล้ว</p>
        <ul className="mt-3 divide-y divide-ink/10 text-sm">
          {!waiting && <li className="py-3 text-ink/60">ไม่มีรายการรอตรวจสอบ</li>}
          {(pending ?? []).map((i: any) => (
            <li key={i.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span><strong>{name(i.tenant_id)}</strong> · #{i.invoice_no} · {i.kind === 'topup' ? 'เติมวอลเล็ต' : `แพ็กเกจ ${i.plan_id} ${i.months} เดือน`} · {dtm(i.created_at)}</span>
                <span className="font-bold">{fmtAmount(Number(i.amount), 'thb')}</span>
              </div>
              <a href={i.slip_url} target="_blank" rel="noreferrer" className="text-brand underline">ดูสลิป</a>
              <form action={review} className="mt-2 flex flex-wrap gap-2">
                <input type="hidden" name="id" value={i.id} />
                <input name="note" placeholder="หมายเหตุ (ไม่บังคับ — ร้านเห็นเมื่อไม่อนุมัติ)" className="input min-w-[220px] flex-1" />
                <button name="do" value="approve" className="btn">อนุมัติ</button>
                <button name="do" value="reject" className="btn-ghost">ไม่อนุมัติ</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">ราคารายเดือน</h2>
        <p className="mt-1 text-xs text-ink/60">ตั้งราคาเป็น บาท / PV / วอลเล็ต ได้พร้อมกัน แล้วติ๊กว่าให้ร้านจ่ายด้วยแบบไหนได้ · ร้านจะจ่ายได้เฉพาะวิธีที่เปิดไว้ “ทุกรายการ” ที่ต้องจ่าย (ค่าเว็บ + ค่ายูสเซอร์ + แพ็กเกจ) · ราคา 0 ในหน่วยที่เปิดไว้ = ฟรี · ติ๊ก “แนะนำ” ได้ 1 แพ็กเกจ</p>
        <div className="mt-4 space-y-3">
          {prices.map((p) => (
            <form key={p.code} action={savePrice} className="card grid gap-3 md:grid-cols-[1.2fr_repeat(3,1fr)]">
              <input type="hidden" name="code" value={p.code} />
              <div>
                <strong>{p.label}</strong>
                <div className="text-xs text-ink/50">{p.kind === 'site' ? 'เก็บทุกร้านต่อเดือน' : p.kind === 'user' ? 'เก็บตามจำนวนยูสเซอร์ที่เกินโควตา' : `แพ็กเกจ ${p.code.replace('plan_', '')}`}</div>
                <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="active" defaultChecked={p.active} /> เปิดใช้งาน</label>
                {p.kind === 'plan' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="recommended" defaultChecked={p.recommended} /> ⭐ ชั้นแนะนำ</label>}
              </div>
              {METHODS.map((m) => (
                <div key={m} className="space-y-1">
                  <label className="block text-xs text-ink/60">{METHOD_LABEL[m]} {m === 'thb' ? '(บาท)' : m === 'pv' ? '(แต้ม)' : '(บาท-เครดิต)'}
                    <input name={`price_${m}`} type="number" min="0" step="0.01" defaultValue={m === 'thb' ? p.price_thb : m === 'pv' ? p.price_pv : p.price_wallet} className="input mt-1" /></label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={`allow_${m}`} defaultChecked={m === 'thb' ? p.allow_thb : m === 'pv' ? p.allow_pv : p.allow_wallet} /> ให้จ่ายแบบนี้</label>
                </div>
              ))}
              <div className="md:col-span-4"><button className="btn">บันทึก {p.label}</button></div>
            </form>
          ))}
        </div>
      </section>

      <section className="card mt-8">
        <h2 className="font-bold">บัญชีรับเงินและกติกา</h2>
        <form action={saveSettings} className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block text-sm">พร้อมเพย์ของแพลตฟอร์ม (เบอร์ 10 หลัก / เลขบัตร-ภาษี 13 หลัก)<input name="promptpay_id" inputMode="numeric" defaultValue={st?.promptpay_id ?? ''} className="input mt-1" /></label>
          <label className="block text-sm">ธนาคาร<input name="bank_name" defaultValue={st?.bank_name ?? ''} className="input mt-1" /></label>
          <label className="block text-sm">เลขที่บัญชี<input name="bank_account" defaultValue={st?.bank_account ?? ''} className="input mt-1" /></label>
          <label className="block text-sm">ชื่อบัญชี<input name="bank_account_name" defaultValue={st?.bank_account_name ?? ''} className="input mt-1" /></label>
          <label className="block text-sm">ยูสเซอร์ที่รวมในค่าเว็บแล้ว (คน)<input name="user_included" type="number" min="0" defaultValue={st?.user_included ?? 1} className="input mt-1" /></label>
          <label className="block text-sm">วันผ่อนผันหลังครบกำหนด (วัน · ใช้แสดงเตือน)<input name="grace_days" type="number" min="0" defaultValue={st?.grace_days ?? 3} className="input mt-1" /></label>
          <div className="md:col-span-2"><button className="btn">บันทึก</button></div>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold">ชำระแล้วล่าสุด</h2>
        <ul className="mt-3 divide-y divide-ink/10 text-sm">
          {!paid?.length && <li className="py-3 text-ink/60">ยังไม่มีรายการ</li>}
          {paid?.map((i: any) => (
            <li key={i.id} className="flex justify-between gap-2 py-2"><span>{name(i.tenant_id)} · #{i.invoice_no} · {i.kind === 'topup' ? 'เติมวอลเล็ต' : `${i.plan_id} ${i.months} เดือน`} · {dtm(i.paid_at)}</span><span>{fmtAmount(Number(i.amount), i.method as Method)}</span></li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink/50">สถานะ: {Object.values(INVOICE_STATUS).join(' / ')}</p>
      </section>
    </>
  )
}
