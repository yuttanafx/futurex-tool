import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { baht } from "@/lib/fmt"
import ChatBox from "./ChatBox"
import ProductGrid, { type GP } from "./ProductGrid"
export const dynamic = "force-dynamic"
async function load(raw: string) {
  const sb = createClient()
  const { data: t } = await sb.from("tenants").select("id,name,tagline,banner_url,shipping_fee,free_shipping_over,promptpay_id,bank_account,cod_enabled").eq("slug", decodeURIComponent(raw)).maybeSingle()
  if (!t) return null
  const [{ data: pages }, { data: products }] = await Promise.all([
    sb.from("sales_pages").select("id,title,seo_title,seo_description").eq("tenant_id", t.id).eq("status", "published"),
    sb.from("products").select("id,name,price,compare_price,image_url,images,category,stock,description,sku").eq("tenant_id", t.id).eq("status", "active").order("created_at", { ascending: false }),
  ])
  return { t, pages: pages ?? [], products: products ?? [] }
}
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const d = await load(params.slug)
  const description = d?.pages[0]?.seo_description ?? d?.t.tagline ?? undefined
  const title = d ? d.pages[0]?.seo_title || d.t.name : "ไม่พบร้านค้า"
  return { title, description, openGraph: { title, description, images: d?.t.banner_url ? [d.t.banner_url] : undefined } }
}
export default async function Shop({ params }: { params: { slug: string } }) {
  const d = await load(params.slug)
  if (!d) notFound()
  const slug = decodeURIComponent(params.slug)
  const base = `/s/${encodeURIComponent(slug)}`
  const intro = d.t.tagline || d.pages.find((p) => p.seo_description)?.seo_description
  const items: GP[] = d.products.map((p: any) => ({
    id: p.id, name: p.name, price: Number(p.price), compare: p.compare_price != null ? Number(p.compare_price) : null,
    image: p.images?.[0] ?? p.image_url ?? null, category: p.category ?? null, stock: p.stock ?? null, description: p.description ?? null, sku: p.sku ?? null,
  }))
  const pay = [d.t.promptpay_id && "พร้อมเพย์ QR", d.t.bank_account && "โอนเงินผ่านธนาคาร", d.t.cod_enabled && "เก็บเงินปลายทาง"].filter(Boolean) as string[]
  const TRUST = [
    ["🚚", "จัดส่งถึงบ้าน", d.t.free_shipping_over ? `ส่งฟรีเมื่อซื้อครบ ${baht(Number(d.t.free_shipping_over))}` : Number(d.t.shipping_fee) > 0 ? `ค่าส่ง ${baht(Number(d.t.shipping_fee))}` : "ส่งฟรีทุกออเดอร์"],
    ["💳", "ชำระเงินสะดวก", pay.length ? pay.join(" · ") : "ร้านแจ้งวิธีชำระเงินหลังสั่งซื้อ"],
    ["🔒", "สั่งซื้อปลอดภัย", "ไม่ต้องสมัครสมาชิก ติดตามออเดอร์ได้ทันที"],
    ["💬", "ถามก่อนซื้อได้", "แชตกับผู้ช่วยของร้านตลอดเวลา"],
  ]
  const ld = { "@context": "https://schema.org", "@type": "Store", name: d.t.name, description: intro ?? undefined, image: d.t.banner_url ?? undefined }
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand to-[#0a4f43]">
        {d.t.banner_url && <img src={d.t.banner_url} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />}
        <div className={`absolute inset-0 -z-10 ${d.t.banner_url ? "bg-gradient-to-r from-black/70 via-black/40 to-transparent" : ""}`} />
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">Official Online Store</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold leading-tight text-white md:text-5xl">{d.t.name}</h1>
          {intro && <p className="mt-4 max-w-xl text-lg text-white/85">{intro}</p>}
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#products" className="inline-flex items-center rounded-md bg-white px-6 py-3 font-medium text-brand shadow hover:bg-white/90">เลือกซื้อสินค้า</a>
            <Link href={`${base}/contact`} className="inline-flex items-center rounded-md border border-white/50 px-6 py-3 font-medium text-white hover:bg-white/10">ติดต่อร้านค้า</Link>
          </div>
          <p className="mt-6 text-sm text-white/70">{d.products.length} รายการสินค้า{items.length > 0 && ` · เริ่มต้น ${baht(Math.min(...items.map((i) => i.price)))}`}</p>
        </div>
      </section>
      <section className="border-b border-ink/10 bg-white">
        <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-5 px-6 py-6 md:grid-cols-4">
          {TRUST.map(([i, t, x]) => <li key={t} className="flex gap-3"><span className="text-2xl" aria-hidden>{i}</span><div><p className="text-sm font-bold">{t}</p><p className="text-xs text-ink/60">{x}</p></div></li>)}
        </ul>
      </section>
      <div className="mx-auto max-w-6xl px-6">
        <h2 id="products" className="mt-12 scroll-mt-24 text-2xl font-bold">สินค้าทั้งหมด</h2>
        <div className="mt-4">
          {!items.length ? <p className="rounded-xl border border-dashed border-ink/20 py-16 text-center text-ink/60">ร้านนี้ยังไม่มีสินค้า ลองสอบถามร้านได้ที่หน้า “ติดต่อผู้ขาย”</p> : <ProductGrid products={items} slug={slug} />}
        </div>
        {d.pages.length > 0 && (
          <section className="mt-16 grid gap-4 md:grid-cols-2">
            {d.pages.map((p) => <article key={p.id} className="card"><h2 className="text-lg font-bold">{p.title}</h2>{p.seo_description && <p className="mt-2 text-sm text-ink/70">{p.seo_description}</p>}</article>)}
          </section>
        )}
        <section className="mt-16 grid gap-8 md:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-bold">สั่งซื้อง่าย ๆ 3 ขั้นตอน</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {["เลือกสินค้าและเพิ่มลงตะกร้า", "กรอกที่อยู่จัดส่ง แล้วเลือกวิธีชำระเงิน", "ชำระเงินและแนบสลิป ร้านจัดส่งให้ทันที"].map((x, i) => (
                <li key={x} className="flex items-center gap-3"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white">{i + 1}</span>{x}</li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-lg font-bold">คุยกับผู้ช่วยของร้าน</h2>
            <p className="mt-1 text-sm text-ink/70">สอบถามรายละเอียดสินค้า โปรโมชัน หรือการจัดส่งได้ตลอดเวลา</p>
            <ChatBox tenant={d.t.id} />
          </div>
        </section>
      </div>
    </main>
  )
}
