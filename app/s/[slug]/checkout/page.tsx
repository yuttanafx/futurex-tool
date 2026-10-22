import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import CheckoutForm from "./CheckoutForm"
export const dynamic = "force-dynamic"
export const metadata = { title: "ชำระเงิน", robots: { index: false } }
export default async function Checkout({ params, searchParams }: { params: { slug: string }; searchParams: { error?: string } }) {
  const slug = decodeURIComponent(params.slug)
  const { data: t } = await createClient().from("tenants").select("id,name,shipping_fee,free_shipping_over,promptpay_id,bank_account,cod_enabled").eq("slug", slug).maybeSingle()
  if (!t) notFound()
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href={`/s/${encodeURIComponent(slug)}`} className="text-sm text-brand underline">← เลือกซื้อสินค้าต่อ</Link>
      <h1 className="mt-3 text-2xl font-bold">ชำระเงิน</h1>
      <div className="mt-6">
        <CheckoutForm tenant={t.id} slug={slug} error={searchParams.error}
          cfg={{ shipping: Number(t.shipping_fee), freeOver: t.free_shipping_over != null ? Number(t.free_shipping_over) : null, promptpay: !!t.promptpay_id, bank: !!t.bank_account, cod: !!t.cod_enabled }} />
      </div>
    </main>
  )
}
