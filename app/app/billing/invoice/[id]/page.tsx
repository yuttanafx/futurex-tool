import Link from 'next/link'
import { notFound } from 'next/navigation'
import QRCode from 'qrcode'
import { getContext } from '@/lib/tenant'
import { promptPayPayload } from '@/lib/promptpay'
import { fmtAmount, INVOICE_STATUS, dtm, type Method } from '@/lib/billing'
import { uploadBillingSlip, cancelInvoice } from '../../actions'
export const dynamic = 'force-dynamic'
const UUID = /^[0-9a-f-]{36}$/i
const SLIP: Record<string, string> = { ok: 'ส่งสลิปแล้ว ผู้ดูแลจะตรวจสอบและอนุมัติโดยเร็ว', bad: 'แนบสลิปไม่สำเร็จ ใช้ไฟล์ JPG/PNG/WebP ไม่เกิน 5MB' }

export default async function Invoice({ params, searchParams }: { params: { id: string }; searchParams: { slip?: string } }) {
  if (!UUID.test(params.id)) notFound()
  const { sb, tenant } = await getContext()
  const [{ data: inv }, { data: pub }] = await Promise.all([
    sb.from('billing_invoices').select('*').eq('id', params.id).eq('tenant_id', tenant.id).maybeSingle(),
    sb.rpc('billing_public'),
  ])
  if (!inv) notFound()
  const p: any = pub ?? {}
  const amount = Number(inv.amount)
  const pending = inv.status === 'pending' && inv.method === 'thb'
  const qr = pending && p.promptpay_id ? await QRCode.toString(promptPayPayload(String(p.promptpay_id), amount), { type: 'svg', margin: 1, width: 260 }) : null
  return (
    <>
      <Link href="/app/billing" className="text-sm text-brand underline">← ค่าบริการ &amp; กระเป๋าเงิน</Link>
      <h1 className="mt-2 text-2xl font-bold">ใบแจ้งหนี้ #{inv.invoice_no}</h1>
      <p className="text-sm text-ink/60">{inv.kind === 'topup' ? 'เติมวอลเล็ต' : `แพ็กเกจ ${inv.plan_id} · ${inv.months} เดือน`} · {dtm(inv.created_at)} · <strong>{INVOICE_STATUS[inv.status]}</strong></p>
      {searchParams.slip && SLIP[searchParams.slip] && <p role="status" className={`mt-4 rounded-md p-3 text-sm ${searchParams.slip === 'ok' ? 'bg-brand/10' : 'bg-sun/30'}`}>{SLIP[searchParams.slip]}</p>}
      {inv.note && <p className="mt-3 rounded-md bg-white/5 p-3 text-sm">หมายเหตุจากผู้ดูแล: {inv.note}</p>}

      <section className="card mt-6 max-w-2xl">
        <ul className="divide-y divide-ink/10 text-sm">
          {(inv.items as any[]).map((i, k) => (
            <li key={k} className="flex justify-between gap-2 py-2"><span>{i.label}{i.qty > 1 ? ` × ${i.qty}` : ''}{i.months > 1 ? ` × ${i.months} เดือน` : ''}</span><span>{fmtAmount(Number(i.total), inv.method as Method)}</span></li>
          ))}
          <li className="flex justify-between py-2 text-base font-bold"><span>รวม</span><span>{fmtAmount(amount, inv.method as Method)}</span></li>
        </ul>
      </section>

      {pending && (
        <section className="card mt-6 max-w-2xl space-y-4">
          <h2 className="font-bold">ชำระเงินด้วยการโอน</h2>
          {qr && (
            <div className="grid items-center gap-6 md:grid-cols-[260px_1fr]">
              <div className="mx-auto rounded-xl border border-ink/10 bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} role="img" aria-label="QR พร้อมเพย์" />
              <div className="text-sm"><p className="text-ink/60">ยอดที่ต้องชำระ</p><p className="text-3xl font-bold text-brand">{fmtAmount(amount, 'thb')}</p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-ink/80"><li>เปิดแอปธนาคาร เลือกสแกน QR</li><li>ตรวจสอบยอดและชื่อบัญชีรับเงิน</li><li>ชำระแล้วแนบสลิปด้านล่าง</li></ol></div>
            </div>
          )}
          {p.bank_account && (
            <dl className="space-y-1 rounded-lg bg-white/5 p-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink/60">ธนาคาร</dt><dd>{p.bank_name || '-'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/60">เลขที่บัญชี</dt><dd className="font-mono font-bold">{p.bank_account}</dd></div>
              <div className="flex justify-between"><dt className="text-ink/60">ชื่อบัญชี</dt><dd>{p.bank_account_name || '-'}</dd></div>
            </dl>
          )}
          {!qr && !p.bank_account && <p className="rounded-md bg-sun/20 p-3 text-sm">ผู้ดูแลระบบยังไม่ได้ตั้งบัญชีรับเงิน กรุณาติดต่อผู้ดูแล</p>}
          <form action={uploadBillingSlip} className="border-t border-ink/10 pt-4">
            <input type="hidden" name="id" value={inv.id} />
            <label className="block text-sm">แนบสลิปโอนเงิน {inv.slip_url && <span className="text-brand">· ส่งสลิปแล้ว (แนบใหม่ได้)</span>}
              <input name="slip" type="file" required accept="image/jpeg,image/png,image/webp" className="input mt-1" /></label>
            <div className="mt-3 flex gap-3"><button className="btn">ส่งสลิป</button></div>
          </form>
          {inv.slip_url && <a href={inv.slip_url} target="_blank" rel="noreferrer" className="block text-sm underline">ดูสลิปที่ส่งแล้ว</a>}
          <form action={cancelInvoice}><input type="hidden" name="id" value={inv.id} /><button className="text-sm underline">ยกเลิกใบแจ้งหนี้นี้</button></form>
        </section>
      )}
    </>
  )
}
