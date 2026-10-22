import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { baht, discountPct } from "@/lib/fmt"
import AddButton from "../../AddButton"
import Gallery from "./Gallery"
import ProductBuy from "./ProductBuy"
export const dynamic = "force-dynamic"
const UUID = /^[0-9a-f-]{36}$/i
async function load(rawSlug: string, id: string) {
  if (!UUID.test(id)) return null
  const sb = createClient()
  const { data: t } = await sb.from("tenants").select("id,name,shipping_fee,free_shipping_over,promptpay_id,bank_account,cod_enabled").eq("slug", decodeURIComponent(rawSlug)).maybeSingle()
  if (!t) return null
  const { data: p } = await sb.from("products").select("id,name,price,compare_price,description,image_url,images,sku,stock,category").eq("id", id).eq("tenant_id", t.id).eq("status", "active").maybeSingle()
  if (!p) return null
  const { data: more } = await sb.from("products").select("id,name,price,compare_price,image_url,images,stock").eq("tenant_id", t.id).eq("status", "active").neq("id", id).order("created_at", { ascending: false }).limit(4)
  return { t, p, more: more ?? [] }
}
export async function generateMetadata({ params }: { params: { slug: string; id: string } }) {
  const d = await load(params.slug, params.id)
  const img = d ? (d.p as any).images?.[0] ?? d.p.image_url : null
  return { title: d ? `${d.p.name} · ${d.t.name}` : "ไม่พบสินค้า", description: d?.p.description?.slice(0, 155), openGraph: { title: d ? `${d.p.name} · ${d.t.name}` : undefined, description: d?.p.description?.slice(0, 155), images: img ? [img] : undefined } }
}
export default async function ProductPage({ params }: { params: { slug: string; id: string } }) {
  const d = await load(params.slug, params.id)
  if (!d) notFound()
  const slug = decodeURIComponent(params.slug)
  const base = `/s/${encodeURIComponent(slug)}`
  const p: any = d.p
  const images: string[] = p.images?.length ? p.images : p.image_url ? [p.image_url] : []
  const price = Number(p.price), compare = p.compare_price != null ? Number(p.compare_price) : null
  const off = discountPct(price, compare)
  const out = p.stock === 0
  const pay = [d.t.promptpay_id && "พร้อมเพย์ QR", d.t.bank_account && "โอนเงินผ่านธนาคาร", d.t.cod_enabled && "เก็บเงินปลายทาง"].filter(Boolean) as string[]
  const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.description ?? undefined, sku: p.sku ?? undefined, image: images.length ? images : undefined, category: p.category ?? undefined,
    offers: { "@type": "Offer", priceCurrency: "THB", price: price, availability: out ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", seller: { "@type": "Organization", name: d.t.name } } }
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <nav aria-label="breadcrumb" className="text-sm text-ink/60"><Link href={base} className="hover:text-brand">หน้าร้าน</Link>{p.category && <> / <span>{p.category}</span></>} / <span className="text-ink">{p.name}</span></nav>
      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <Gallery images={images} name={p.name} />
        <div>
          {p.category && <p className="text-sm text-brand">{p.category}</p>}
          <h1 className="mt-1 text-3xl font-bold leading-tight">{p.name}</h1>
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold text-brand">{baht(price)}</span>
            {off > 0 && <><span className="text-lg text-ink/40 line-through">{baht(compare!)}</span><span className="rounded-md bg-red-600 px-2 py-0.5 text-sm font-bold text-white">ลด {off}%</span></>}
          </div>
          <p className="mt-3 text-sm">{out ? <span className="font-medium text-red-700">● สินค้าหมด</span> : p.stock != null && p.stock <= 10 ? <span className="font-medium text-amber-700">● เหลือเพียง {p.stock} ชิ้น</span> : <span className="font-medium text-brand">● พร้อมจัดส่ง</span>}{p.sku && <span className="ml-3 text-ink/50">รหัสสินค้า {p.sku}</span>}</p>
          <ProductBuy slug={slug} item={{ id: p.id, name: p.name, price, image: images[0] ?? null, max: p.stock ?? null }} />
          <ul className="mt-6 space-y-2 rounded-xl border border-ink/10 bg-white p-4 text-sm">
            <li>🚚 {d.t.free_shipping_over ? `ส่งฟรีเมื่อซื้อครบ ${baht(Number(d.t.free_shipping_over))}` : Number(d.t.shipping_fee) > 0 ? `ค่าจัดส่ง ${baht(Number(d.t.shipping_fee))}` : "ส่งฟรี"}</li>
            <li>💳 {pay.length ? pay.join(" · ") : "ร้านแจ้งวิธีชำระเงินหลังสั่งซื้อ"}</li>
            <li>💬 มีคำถามก่อนซื้อ? <Link href={`${base}/contact`} className="text-brand underline">ถามร้านค้า</Link></li>
          </ul>
        </div>
      </div>
      <section className="mt-12 max-w-3xl">
        <h2 className="border-b border-ink/10 pb-2 text-lg font-bold">รายละเอียดสินค้า</h2>
        {p.description ? <p className="mt-4 whitespace-pre-line leading-relaxed text-ink/80">{p.description}</p> : <p className="mt-4 text-sm text-ink/50">ร้านยังไม่ได้ระบุรายละเอียด สอบถามเพิ่มเติมได้ที่ผู้ขาย</p>}
      </section>
      {d.more.length > 0 && (
        <section className="mt-16">
          <h2 className="text-xl font-bold">สินค้าอื่นจากร้านนี้</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {d.more.map((m: any) => (
              <li key={m.id} className="flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white">
                <Link href={`${base}/products/${m.id}`} className="block aspect-square bg-ink/5">{(m.images?.[0] ?? m.image_url) ? <img src={m.images?.[0] ?? m.image_url} alt={m.name} loading="lazy" className="h-full w-full object-cover" /> : null}</Link>
                <div className="flex flex-1 flex-col p-3"><Link href={`${base}/products/${m.id}`} className="line-clamp-2 min-h-10 text-sm font-medium hover:text-brand">{m.name}</Link><p className="font-bold text-brand">{baht(Number(m.price))}</p>
                  <div className="mt-2"><AddButton item={{ id: m.id, name: m.name, price: Number(m.price), image: m.images?.[0] ?? m.image_url ?? null, max: m.stock ?? null }} /></div></div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
