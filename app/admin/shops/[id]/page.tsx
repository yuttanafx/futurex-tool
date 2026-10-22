import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { baht } from "@/lib/fmt"
export const dynamic = "force-dynamic"
const UUID = /^[0-9a-f-]{36}$/i
const ST: Record<string, string> = { new: "ใหม่", confirmed: "ยืนยันแล้ว", shipped: "จัดส่งแล้ว", done: "สำเร็จ", cancelled: "ยกเลิก" }
const PAY: Record<string, string> = { unpaid: "ยังไม่ชำระ", paid: "ชำระแล้ว", refunded: "คืนเงินแล้ว" }
const M: Record<string, string> = { promptpay: "พร้อมเพย์", bank: "โอนธนาคาร", cod: "ปลายทาง", later: "ภายหลัง" }
export default async function ShopDetail({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound()
  const { data } = await createClient().rpc("admin_shop_detail", { p_id: params.id })
  const d: any = data
  if (!d) notFound()
  const s = d.shop
  const K: [string, string][] = [
    ["ยอดขายรวม", baht(Number(d.sales))], ["ชำระแล้ว", baht(Number(d.paid_sales))], ["ออเดอร์", `${d.orders}`], ["ลูกค้า", `${d.customers}`],
    ["สินค้า (เปิดขาย)", `${d.products} (${d.active_products})`], ["AI วันนี้", `${d.ai_used_today ?? 0}`],
  ]
  return (
    <>
      <Link href="/admin" className="text-sm text-brand underline">← ภาพรวมทุกร้าน</Link>
      <h1 className="mt-2 text-2xl font-bold">{s.name} {s.status !== "active" && <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 align-middle text-xs text-white">ถูกระงับ</span>}</h1>
      <p className="text-sm text-ink/60">เจ้าของ {s.owner_email ?? "-"} · แพ็กเกจ {s.plan_id} · /s/{s.slug} · ช่องทางรับเงิน: {[s.promptpay && "พร้อมเพย์", s.bank && "ธนาคาร", s.cod && "ปลายทาง"].filter(Boolean).join(", ") || "ยังไม่ตั้งค่า"}</p>
      {s.status === "active" && <Link href={`/s/${encodeURIComponent(s.slug)}`} target="_blank" className="mt-1 inline-block text-sm text-brand underline">เปิดหน้าร้าน</Link>}
      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 [&>div]:card">{K.map(([k, v]) => <div key={k}><dt className="text-sm text-ink/60">{k}</dt><dd className="text-2xl font-bold">{v}</dd></div>)}</dl>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="card"><h2 className="font-bold">สินค้าขายดี</h2>
          <ul className="mt-3 divide-y divide-ink/10 text-sm">{!d.top_products.length && <li className="py-3 text-ink/60">ยังไม่มียอดขาย</li>}
            {d.top_products.map((p: any) => <li key={p.name} className="flex justify-between py-2"><span>{p.name} ×{p.qty}</span><span>{baht(Number(p.revenue))}</span></li>)}</ul></section>
        <section className="card"><h2 className="font-bold">ออเดอร์ล่าสุด</h2>
          <ul className="mt-3 divide-y divide-ink/10 text-sm">{!d.recent_orders.length && <li className="py-3 text-ink/60">ยังไม่มีออเดอร์</li>}
            {d.recent_orders.map((o: any) => <li key={o.order_no} className="flex justify-between gap-2 py-2"><span>#{o.order_no} · {ST[o.status]} · {PAY[o.payment_status]} · {M[o.payment_method]}</span><span>{baht(Number(o.total))}</span></li>)}</ul></section>
      </div>
    </>
  )
}
