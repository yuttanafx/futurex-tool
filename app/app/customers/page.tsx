import { getContext } from "@/lib/tenant"
export default async function Customers() {
  const { sb } = await getContext()
  const { data } = await sb.from("customers").select("id,name,phone,email,created_at").order("created_at", { ascending: false }).limit(200)
  return (
    <>
      <h1 className="text-2xl font-bold">ลูกค้า</h1>
      <ul className="mt-6 divide-y divide-ink/10">
        {!data?.length && <li className="py-6 text-sm text-ink/60">ยังไม่มีลูกค้า ระบบจะบันทึกให้อัตโนมัติเมื่อมีคำสั่งซื้อ</li>}
        {data?.map((c) => <li key={c.id} className="py-3"><div className="font-medium">{c.name}</div><div className="text-sm text-ink/60">{[c.phone, c.email].filter(Boolean).join(" · ")}</div></li>)}
      </ul>
    </>
  )
}
