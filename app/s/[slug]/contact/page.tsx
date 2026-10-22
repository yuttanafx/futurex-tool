import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ChatBox from "../ChatBox"
export const dynamic = "force-dynamic"
export default async function Contact({ params }: { params: { slug: string } }) {
  const { data: t } = await createClient().from("tenants").select("id,name").eq("slug", decodeURIComponent(params.slug)).maybeSingle()
  if (!t) notFound()
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">ติดต่อ {t.name}</h1>
      <p className="mt-2 text-sm text-ink/70">สอบถามสินค้าหรือการสั่งซื้อกับผู้ช่วยของร้านได้ที่นี่ หากต้องการคุยกับเจ้าหน้าที่ ให้แจ้งในแชต</p>
      <ChatBox tenant={t.id} />
    </main>
  )
}
