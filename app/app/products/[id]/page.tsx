import { revalidatePath } from "next/cache"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { getContext } from "@/lib/tenant"
import { uploadImages } from "@/lib/upload"
export const dynamic = "force-dynamic"
const UUID = /^[0-9a-f-]{36}$/i
const num = (v: FormDataEntryValue | null) => { const s = String(v ?? "").trim(); if (s === "") return null; const n = Number(s); return Number.isFinite(n) && n >= 0 ? n : null }
async function save(fd: FormData) {
  "use server"
  const { sb, tenant } = await getContext()
  const id = String(fd.get("id"))
  if (!UUID.test(id)) return
  const price = num(fd.get("price")), name = String(fd.get("name") || "").trim()
  if (!name || price == null) return
  const { data: cur } = await sb.from("products").select("images").eq("id", id).eq("tenant_id", tenant.id).maybeSingle()
  if (!cur) return
  const drop = new Set(fd.getAll("drop").map(String))
  const kept = ((cur.images as string[]) ?? []).filter((u) => !drop.has(u))
  const images = [...kept, ...(await uploadImages(sb, "shop-media", tenant.id, fd.getAll("images"), Math.max(0, 8 - kept.length)))]
  const stock = num(fd.get("stock"))
  await sb.from("products").update({
    name: name.slice(0, 200), price, compare_price: num(fd.get("compare_price")), stock: stock == null ? null : Math.floor(stock),
    category: String(fd.get("category") || "").trim().slice(0, 60) || null, sku: String(fd.get("sku") || "").trim() || null,
    description: String(fd.get("description") || "").trim().slice(0, 4000) || null, images, image_url: images[0] ?? null,
  }).eq("id", id).eq("tenant_id", tenant.id)
  revalidatePath("/app/products")
  redirect("/app/products")
}
export default async function EditProduct({ params }: { params: { id: string } }) {
  if (!UUID.test(params.id)) notFound()
  const { sb } = await getContext()
  const { data: p } = await sb.from("products").select("*").eq("id", params.id).maybeSingle()
  if (!p) notFound()
  const imgs: string[] = p.images ?? []
  return (
    <>
      <Link href="/app/products" className="text-sm text-brand underline">← กลับรายการสินค้า</Link>
      <h1 className="mt-2 text-2xl font-bold">แก้ไขสินค้า</h1>
      <form action={save} className="card mt-6 grid gap-3 md:grid-cols-2">
        <input type="hidden" name="id" value={p.id} />
        <input name="name" required defaultValue={p.name} placeholder="ชื่อสินค้า" className="input md:col-span-2" />
        <input name="price" type="number" min="0" step="0.01" required defaultValue={p.price} placeholder="ราคาขาย" className="input" />
        <input name="compare_price" type="number" min="0" step="0.01" defaultValue={p.compare_price ?? ""} placeholder="ราคาก่อนลด" className="input" />
        <input name="stock" type="number" min="0" step="1" defaultValue={p.stock ?? ""} placeholder="สต็อก (ว่าง = ไม่จำกัด)" className="input" />
        <input name="category" defaultValue={p.category ?? ""} placeholder="หมวดหมู่" className="input" />
        <input name="sku" defaultValue={p.sku ?? ""} placeholder="SKU" className="input md:col-span-2" />
        {imgs.length > 0 && (
          <fieldset className="md:col-span-2"><legend className="text-sm text-ink/70">รูปปัจจุบัน (ติ๊กเพื่อลบ · รูปแรกเป็นรูปปก)</legend>
            <div className="mt-2 flex flex-wrap gap-3">{imgs.map((u) => (
              <label key={u} className="relative block"><img src={u} alt="" className="h-24 w-24 rounded-md object-cover" /><span className="mt-1 flex items-center gap-1 text-xs"><input type="checkbox" name="drop" value={u} /> ลบ</span></label>
            ))}</div></fieldset>
        )}
        <label className="block text-sm md:col-span-2"><span className="text-ink/70">เพิ่มรูปใหม่ (รวมไม่เกิน 8 รูป)</span><input name="images" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="input mt-1" /></label>
        <textarea name="description" rows={6} maxLength={4000} defaultValue={p.description ?? ""} placeholder="รายละเอียดสินค้า" className="input md:col-span-2" />
        <button className="btn justify-center md:col-span-2">บันทึก</button>
      </form>
    </>
  )
}
