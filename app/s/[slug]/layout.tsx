import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { baht } from "@/lib/fmt"
import CartProvider from "./CartProvider"
import ShopHeader from "./ShopHeader"
export default async function ShopLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  const slug = decodeURIComponent(params.slug)
  const { data: t } = await createClient().from("tenants").select("name,free_shipping_over,tagline").eq("slug", slug).maybeSingle()
  if (!t) notFound()
  const base = `/s/${encodeURIComponent(slug)}`
  const free = t.free_shipping_over ? `ส่งฟรีเมื่อซื้อครบ ${baht(Number(t.free_shipping_over))}` : undefined
  return (
    <CartProvider slug={slug}>
      <ShopHeader name={t.name} slug={slug} free={free} />
      {children}
      <footer className="mt-20 border-t border-ink/10 bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 text-sm md:grid-cols-3">
          <div><p className="text-base font-bold">{t.name}</p>{t.tagline && <p className="mt-2 text-ink/60">{t.tagline}</p>}</div>
          <div><p className="font-medium">เมนู</p><ul className="mt-2 space-y-1 text-ink/70"><li><Link href={base} className="hover:text-brand">หน้าร้าน</Link></li><li><Link href={`${base}#products`} className="hover:text-brand">สินค้าทั้งหมด</Link></li><li><Link href={`${base}/contact`} className="hover:text-brand">ติดต่อผู้ขาย</Link></li></ul></div>
          <div><p className="font-medium">ช้อปอย่างมั่นใจ</p><ul className="mt-2 space-y-1 text-ink/70"><li>สั่งซื้อได้โดยไม่ต้องสมัครสมาชิก</li><li>ชำระผ่านพร้อมเพย์ โอนบัญชี หรือเก็บเงินปลายทาง (ตามที่ร้านเปิด)</li><li>ติดตามออเดอร์ได้จากลิงก์ที่ได้รับหลังสั่งซื้อ</li></ul></div>
        </div>
        <p className="border-t border-ink/10 py-4 text-center text-xs text-ink/40">© {new Date().getFullYear()} TERRAVOLTECO · ขับเคลื่อนโดย AI FutureX Tool</p>
      </footer>
    </CartProvider>
  )
}
