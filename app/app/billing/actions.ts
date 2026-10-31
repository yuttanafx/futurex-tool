'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getContext } from '@/lib/tenant'
import { uploadImages } from '@/lib/upload'
import { isMethod, billErr, PLAN_IDS, MONTH_CHOICES } from '@/lib/billing'
const UUID = /^[0-9a-f-]{36}$/i
const back = (q: string) => redirect(`/app/billing?${q}`)

export async function pay(fd: FormData) {
  const { sb, role } = await getContext()
  if (!['owner', 'admin'].includes(role)) back('err=' + encodeURIComponent(billErr('forbidden')))
  const plan = String(fd.get('plan')), method = String(fd.get('method')), months = Number(fd.get('months'))
  if (!(PLAN_IDS as readonly string[]).includes(plan) || !isMethod(method) || !MONTH_CHOICES.includes(months)) back('err=' + encodeURIComponent(billErr('invalid')))
  // ยอดเงินคำนวณใน DB เสมอ ไม่เชื่อค่าจากหน้าเว็บ
  const { data, error } = await sb.rpc('billing_pay', { p_plan: plan, p_method: method, p_months: months })
  if (error || !data) back('err=' + encodeURIComponent(billErr(error?.message)))
  revalidatePath('/app', 'layout')
  const r = data as { invoice: string; status: string }
  if (r.status === 'pending') redirect(`/app/billing/invoice/${r.invoice}`)
  back('ok=paid')
}

export async function topup(fd: FormData) {
  const { sb, role } = await getContext()
  if (!['owner', 'admin'].includes(role)) back('err=' + encodeURIComponent(billErr('forbidden')))
  const amount = Number(fd.get('amount'))
  if (!Number.isFinite(amount)) back('err=' + encodeURIComponent(billErr('invalid amount')))
  const { data, error } = await sb.rpc('billing_topup_request', { p_amount: amount })
  if (error || !data) back('err=' + encodeURIComponent(billErr(error?.message)))
  redirect(`/app/billing/invoice/${(data as any).invoice}`)
}

export async function uploadBillingSlip(fd: FormData) {
  const { sb } = await getContext()
  const id = String(fd.get('id'))
  if (!UUID.test(id)) back('')
  const to = `/app/billing/invoice/${id}`
  const [url] = await uploadImages(sb, 'slips', `billing-${id}`, fd.getAll('slip'), 1)
  if (!url) redirect(`${to}?slip=bad`)
  const { data } = await sb.rpc('billing_submit_slip', { p_invoice: id, p_url: url })
  revalidatePath(to)
  redirect(`${to}?slip=${data ? 'ok' : 'bad'}`)
}

export async function cancelInvoice(fd: FormData) {
  const { sb } = await getContext()
  const id = String(fd.get('id'))
  if (UUID.test(id)) await sb.rpc('billing_cancel_invoice', { p_invoice: id })
  revalidatePath('/app/billing')
  back('ok=cancelled')
}
