import { revalidatePath } from "next/cache"
import Link from "next/link"
import { getContext } from "@/lib/tenant"
import { baht } from "@/lib/fmt"
import { uploadImages } from "@/lib/upload"
const num = (v: FormDataEntryValue | null) => { const s = String(v ?? "").trim(); if (s === "") return null; const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : null }
async function addProduct(fd: FormData) {
  "use server"
  const { sb, tenant } = await getContext()
  const name = String(fd.get("name") || "").trim()
  const price = num(fd.get("price"))
  if (!name || price == null) return
  const images = await uploadImages(sb, "shop-media", tenant.id, fd.getAll("images"))
  const stock = num(fd.get("stock"))
  await sb.from("products").insert({
    tenant_id: tenant.id, name: name.slice(0, 200), price,
    compare_price: num(fd.get("compare_price")),
    stock: stock == null ? null : Math.floor(stock),
    category: String(fd.get("category") || "").trim().slice(0, 60) || null,
    sku: String(fd.get("sku") || "").trim() || null,
    description: String(fd.get("description") || "").trim().slice(0, 4000) || null,
    images, image_url: images[0] ?? null,
  })
  revalidatePath("/app/products")
}
async function toggle(fd: FormData) {
  "use server"
  const { sb, tenant } = await getContext()
  await sb.from("products").update({ status: String(fd.get("to")) === "active" ? "active" : "hidden" }).eq("id", String(fd.get("id"))).eq("tenant_id", tenant.id)
  revalidatePath("/app/products")
}
async function remove(fd: FormData) {
  "use server"
  const { sb, tenant } = await getContext() // กรอง tenant ซ้ำอีกชั้นนอกจาก RLS
  await sb.from("products").delete().eq("id", String(fd.get("id"))).eq("tenant_id", tenant.id)
  revalidatePath("/app/products")
}
async function loadStarter() {
  "use server"
  const { sb } = await getContext() // ฟังก์ชันในฐานข้อมูลใส่ให้เฉพาะร้านของผู้ล็อกอิน และเฉพาะเมื่อร้านยังไม่มีสินค้า
  await sb.rpc("load_starter_products")
  revalidatePath("/app/products")
}
export const dynamic = "force-dynamic"
export default async function Products() {
  const { sb, tenant } = await getContext()
  const { data } = await sb.from("products").select("id,name,sku,price,compare_price,stock,category,status,image_url,images").eq("tenant_id", tenant.id).order("created_at", { ascending: false })
  return (
    <>
      <h1 className="text-2xl font-bold">สินค้า</h1>
      <p className="mt-1 text-sm text-ink/60">สินค้าที่เพิ่มที่นี่จะขึ้นที่หน้าร้านพร้อมตะกร้าและการชำระเงิน</p>
      {data?.some((p: any) => String(p.sku ?? "").startsWith("SAMPLE-")) && (
        <p className="mt-4 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900">ร้านของคุณมีสินค้าตัวอย่าง (รหัส SAMPLE-…) แก้ชื่อ ราคา รูป หรือลบทิ้งได้เลย เมื่อพร้อมขายของจริง</p>
      )}
      <form action={addProduct} className="card mt-6 grid gap-3 md:grid-cols-2">
        <input name="name" required placeholder="ชื่อสินค้า" className="input md:col-span-2" />
        <input name="price" type="number" min="0" step="0.01" required placeholder="ราคาขาย (บาท)" className="input" />
        <input name="compare_price" type="number" min="0" step="0.01" placeholder="ราคาก่อนลด (ถ้ามี จะแสดงขีดฆ่า + % ส่วนลด)" className="input" />
        <input name="stock" type="number" min="0" step="1" placeholder="จำนวนสต็อก (เว้นว่าง = ไม่จำกัด)" className="input" />
        <input name="category" placeholder="หมวดหมู่ เช่น เสื้อผ้า, อาหารเสริม" className="input" />
        <input name="sku" placeholder="รหัสสินค้า (SKU)" className="input md:col-span-2" />
        <label className="block text-sm md:col-span-2"><span className="text-ink/70">รูปสินค้า (เลือกได้หลายรูป · รูปแรกเป็นรูปปก · JPG/PNG/WebP ไม่เกิน 5MB/รูป)</span>
          <input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="input mt-1" /></label>
        <textarea name="description" rows={4} maxLength={4000} placeholder="รายละเอียดสินค้า (ขึ้นบรรทัดใหม่ได้)" className="input md:col-span-2" />
        <button className="btn justify-center md:col-span-2">เพิ่มสินค้า</button>
      </form>
      <ul className="mt-8 divide-y divide-ink/10">
        {!data?.length && <li className="py-6 text-sm text-ink/60">ยังไม่มีสินค้า เพิ่มสินค้าแรกจากฟอร์มด้านบน หรือ <form action={loadStarter} className="inline"><button className="text-brand underline">โหลดสินค้าตัวอย่าง</button></form></li>}
        {data?.map((p: any) => {
          const img = p.images?.[0] ?? p.image_url
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-4 py-4">
              {img ? <img src={img} alt="" className="h-16 w-16 rounded-md object-cover" /> : <div className="h-16 w-16 rounded-md bg-ink/5" />}
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.name}</div>
                <div className="text-sm text-ink/60">
                  {baht(Number(p.price))}{p.compare_price ? <s className="ml-1 text-ink/40">{baht(Number(p.compare_price))}</s> : null}
                  {p.category ? ` · ${p.category}` : ""}{p.sku ? ` · ${p.sku}` : ""} · {p.stock == null ? "สต็อกไม่จำกัด" : p.stock === 0 ? "สินค้าหมด" : `เหลือ ${p.stock}`}{p.status !== "active" ? " · ซ่อนอยู่" : ""} · {p.images?.length ?? 0} รูป
                </div>
                <div className="flex gap-3 text-sm">
                  <Link href={`/app/products/${p.id}`} className="text-brand underline">แก้ไข</Link>
                  {p.status === "active" && <Link href={`/s/${tenant.slug}/products/${p.id}`} target="_blank" className="text-brand underline">ดูหน้าสินค้า</Link>}
                </div>
              </div>
              <form action={toggle}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="to" value={p.status === "active" ? "hidden" : "active"} />
                <button className="btn-ghost">{p.status === "active" ? "ซ่อน" : "แสดง"}</button>
              </form>
              <form action={remove}><input type="hidden" name="id" value={p.id} /><button className="btn-ghost text-red-700">ลบ</button></form>
            </li>
          )
        })}
      </ul>
    </>
  )
}
