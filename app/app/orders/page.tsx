import { revalidatePath } from "next/cache"
import { getContext } from "@/lib/tenant"
import { baht } from "@/lib/fmt"
const METHOD: Record<string, string> = { promptpay: "พร้อมเพย์", bank: "โอนธนาคาร", cod: "เก็บเงินปลายทาง", later: "ชำระภายหลัง" }
const ST: Record<string, string> = { new: "ใหม่", confirmed: "ยืนยันแล้ว", shipped: "จัดส่งแล้ว", done: "สำเร็จ", cancelled: "ยกเลิก" }
async function update(fd: FormData) {
  "use server"
  const { sb } = await getContext()
  const status = String(fd.get("status")), pay = String(fd.get("payment_status"))
  if (!(status in ST) || !["unpaid", "paid", "refunded"].includes(pay)) return
  await sb.from("orders").update({ status, payment_status: pay }).eq("id", String(fd.get("id")))
  revalidatePath("/app/orders")
}
export default async function Orders() {
  const { sb } = await getContext()
  const { data } = await sb.from("orders").select("id,order_no,status,payment_status,payment_method,shipping_fee,ship_address,note,slip_url,total,created_at,customers(name,phone),order_items(name,quantity),referrer:tenants!referrer_tenant_id(name)").order("created_at", { ascending: false }).limit(100)
  return (
    <>
      <h1 className="text-2xl font-bold">คำสั่งซื้อ</h1>
      <ul className="mt-6 divide-y divide-ink/10">
        {!data?.length && <li className="py-6 text-sm text-ink/60">ยังไม่มีคำสั่งซื้อ เมื่อลูกค้าสั่งจากหน้าร้าน รายการจะขึ้นที่นี่</li>}
        {data?.map((o: any) => (
          <li key={o.id} className="py-4">
            <div className="flex justify-between"><strong>#{o.order_no} · {baht(Number(o.total))}</strong><span className="text-sm text-ink/60">{new Date(o.created_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}</span></div>
            <div className="text-sm text-ink/70">{o.customers?.name} {o.customers?.phone && `· ${o.customers.phone}`} — {o.order_items.map((i: any) => `${i.name} ×${i.quantity}`).join(", ")}</div>
            <div className="mt-1 text-sm text-ink/70">ชำระ: {METHOD[o.payment_method] ?? o.payment_method}{Number(o.shipping_fee) > 0 && ` · ค่าส่ง ${baht(Number(o.shipping_fee))}`}{o.slip_url && <> · <a href={o.slip_url} target="_blank" rel="noreferrer" className="text-brand underline">ดูสลิป</a></>}</div>
            {o.ship_address && <div className="text-sm text-ink/70">จัดส่ง: {o.ship_address}</div>}
            {o.note && <div className="text-sm text-ink/70">หมายเหตุ: {o.note}</div>}
            {o.referrer && <div className="text-xs text-ink/60">มาจากลิงก์แนะนำของ {o.referrer.name}</div>}
            <form action={update} className="mt-2 flex gap-2">
              <input type="hidden" name="id" value={o.id} />
              <select name="status" defaultValue={o.status} className="input w-auto">{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <select name="payment_status" defaultValue={o.payment_status} className="input w-auto"><option value="unpaid">ยังไม่ชำระ</option><option value="paid">ชำระแล้ว</option><option value="refunded">คืนเงินแล้ว</option></select>
              <button className="btn">บันทึก</button>
            </form>
          </li>
        ))}
      </ul>
    </>
  )
}
