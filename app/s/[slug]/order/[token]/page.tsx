import Link from "next/link"
import { notFound } from "next/navigation"
import QRCode from "qrcode"
import { createClient } from "@/lib/supabase/server"
import { baht } from "@/lib/fmt"
import { promptPayPayload } from "@/lib/promptpay"
import { uploadSlip } from "../../actions"
import ClearCart from "../../ClearCart"
export const dynamic = "force-dynamic"
export const metadata = { title: "คำสั่งซื้อของคุณ", robots: { index: false } }
const UUID = /^[0-9a-f-]{36}$/i
const ST: Record<string, string> = { new: "รอร้านยืนยัน", confirmed: "ร้านยืนยันแล้ว", shipped: "จัดส่งแล้ว", done: "สำเร็จ", cancelled: "ยกเลิก" }
const PAY: Record<string, string> = { unpaid: "ยังไม่ชำระ", paid: "ชำระแล้ว", refunded: "คืนเงินแล้ว" }
const METHOD: Record<string, string> = { promptpay: "พร้อมเพย์ QR", bank: "โอนเงินผ่านธนาคาร", cod: "เก็บเงินปลายทาง", later: "ร้านติดต่อแจ้งวิธีชำระเงิน" }
const SLIP: Record<string, string> = { ok: "ส่งสลิปแล้ว ร้านจะตรวจสอบและยืนยันให้เร็วที่สุด", bad: "แนบสลิปไม่สำเร็จ ใช้ไฟล์ JPG/PNG/WebP ไม่เกิน 5MB", rate: "แนบสลิปบ่อยเกินไป กรุณารอสักครู่" }
export default async function OrderPage({ params, searchParams }: { params: { slug: string; token: string }; searchParams: { slip?: string } }) {
  if (!UUID.test(params.token)) notFound()
  const { data } = await createClient().rpc("get_order_public", { p_token: params.token })
  const o = data as any
  if (!o) notFound()
  const slug = decodeURIComponent(params.slug)
  const total = Number(o.total)
  const qr = o.payment_method === "promptpay" && o.shop.promptpay_id && o.payment_status === "unpaid"
    ? await QRCode.toString(promptPayPayload(o.shop.promptpay_id, total), { type: "svg", margin: 1, width: 260 }) : null
  const needsPay = o.payment_status === "unpaid" && ["promptpay", "bank"].includes(o.payment_method)
  const sub = o.items.reduce((a: number, i: any) => a + Number(i.unit_price) * i.quantity, 0)
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <ClearCart />
      <div className="rounded-2xl bg-brand/10 p-6 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand text-2xl text-white" aria-hidden>✓</div>
        <h1 className="mt-3 text-2xl font-bold">รับคำสั่งซื้อแล้ว</h1>
        <p className="mt-1 text-ink/70">หมายเลขคำสั่งซื้อ <strong>#{o.order_no}</strong> · {new Date(o.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</p>
        <p className="mt-3 flex flex-wrap justify-center gap-2 text-sm"><span className="rounded-full bg-white px-3 py-1">{ST[o.status]}</span><span className="rounded-full bg-white px-3 py-1">{PAY[o.payment_status]}</span></p>
        <p className="mt-3 text-xs text-ink/60">บันทึกลิงก์หน้านี้ไว้เพื่อติดตามสถานะและแนบสลิป</p>
      </div>
      {searchParams.slip && SLIP[searchParams.slip] && <p role="status" className={`mt-6 rounded-md p-3 text-sm ${searchParams.slip === "ok" ? "bg-brand/10" : "bg-sun/30"}`}>{SLIP[searchParams.slip]}</p>}

      <section className="card mt-6">
        <h2 className="font-bold">การชำระเงิน · {METHOD[o.payment_method]}</h2>
        {o.payment_status === "paid" && <p className="mt-3 text-sm text-brand">ร้านยืนยันการชำระเงินแล้ว ขอบคุณที่ซื้อสินค้า</p>}
        {o.payment_method === "later" && <p className="mt-3 text-sm text-ink/70">ร้านจะติดต่อกลับทางเบอร์ {o.customer?.phone} เพื่อแจ้งวิธีชำระเงิน</p>}
        {o.payment_method === "cod" && <p className="mt-3 text-sm text-ink/70">เตรียมเงินสด <strong>{baht(total)}</strong> ไว้ชำระเมื่อได้รับสินค้า</p>}
        {qr && (
          <div className="mt-4 grid items-center gap-6 md:grid-cols-[260px_1fr]">
            <div className="mx-auto rounded-xl border border-ink/10 bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} aria-label="QR พร้อมเพย์" role="img" />
            <div className="text-sm"><p className="text-ink/60">ยอดที่ต้องชำระ</p><p className="text-3xl font-bold text-brand">{baht(total)}</p>
              <ol className="mt-3 list-decimal space-y-1 pl-5 text-ink/80"><li>เปิดแอปธนาคาร เลือกสแกน QR</li><li>ตรวจสอบยอดและชื่อบัญชีรับเงิน</li><li>ชำระแล้วแนบสลิปด้านล่าง</li></ol></div>
          </div>
        )}
        {o.payment_method === "bank" && o.payment_status === "unpaid" && (
          <dl className="mt-4 space-y-1 rounded-lg bg-mist p-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink/60">ธนาคาร</dt><dd>{o.shop.bank_name || "-"}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">เลขที่บัญชี</dt><dd className="font-mono font-bold">{o.shop.bank_account}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">ชื่อบัญชี</dt><dd>{o.shop.bank_account_name || "-"}</dd></div>
            <div className="flex justify-between border-t border-ink/10 pt-2"><dt className="text-ink/60">ยอดที่ต้องโอน</dt><dd className="text-lg font-bold text-brand">{baht(total)}</dd></div>
          </dl>
        )}
        {needsPay && (
          <form action={uploadSlip} className="mt-5 border-t border-ink/10 pt-4">
            <input type="hidden" name="slug" value={slug} /><input type="hidden" name="token" value={params.token} />
            <label className="block text-sm font-medium">แนบสลิปการโอนเงิน<input name="slip" type="file" accept="image/jpeg,image/png,image/webp" required className="input mt-2" /></label>
            <button className="btn mt-3">{o.slip_url ? "ส่งสลิปใหม่" : "ส่งสลิป"}</button>
          </form>
        )}
        {o.slip_url && <div className="mt-4"><p className="text-sm text-ink/60">สลิปที่ส่งแล้ว (รอร้านตรวจสอบ)</p><a href={o.slip_url} target="_blank" rel="noreferrer"><img src={o.slip_url} alt="สลิปการโอนเงิน" className="mt-2 max-h-56 rounded-lg border border-ink/10" /></a></div>}
      </section>

      <section className="card mt-6">
        <h2 className="font-bold">รายการสินค้า</h2>
        <ul className="mt-3 divide-y divide-ink/10 text-sm">{o.items.map((i: any, k: number) => <li key={k} className="flex justify-between py-2"><span>{i.name} × {i.quantity}</span><span>{baht(Number(i.unit_price) * i.quantity)}</span></li>)}</ul>
        <dl className="mt-2 space-y-1 border-t border-ink/10 pt-2 text-sm">
          <div className="flex justify-between"><dt className="text-ink/60">ยอดสินค้า</dt><dd>{baht(sub)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink/60">ค่าจัดส่ง</dt><dd>{Number(o.shipping_fee) ? baht(Number(o.shipping_fee)) : "ฟรี"}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>ยอดรวม</dt><dd>{baht(total)}</dd></div>
        </dl>
        <h3 className="mt-5 text-sm font-bold">จัดส่งไปที่</h3>
        <p className="mt-1 whitespace-pre-line text-sm text-ink/70">{o.customer?.name} · {o.customer?.phone}{"\n"}{o.ship_address}</p>
      </section>
      <div className="mt-8 flex flex-wrap gap-3"><Link href={`/s/${encodeURIComponent(slug)}`} className="btn">กลับไปเลือกซื้อสินค้า</Link><Link href={`/s/${encodeURIComponent(slug)}/contact`} className="btn-ghost">ติดต่อร้านค้า</Link></div>
    </main>
  )
}
