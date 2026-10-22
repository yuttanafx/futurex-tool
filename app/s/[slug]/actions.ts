"use server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { limited } from "@/lib/ratelimit"
import { uploadImages } from "@/lib/upload"
const UUID = /^[0-9a-f-]{36}$/i

// ชำระเงิน: ราคา ค่าส่ง และสต็อก คำนวณใน DB เสมอ ไม่เชื่อค่าจากหน้าเว็บ
export async function checkout(fd: FormData) {
  const slug = String(fd.get("slug"))
  const back = `/s/${encodeURIComponent(slug)}/checkout`
  const tenant = String(fd.get("tenant"))
  if (!UUID.test(tenant)) redirect(`${back}?error=invalid`)
  if (await limited(`order:${tenant}`, 8, 600)) redirect(`${back}?error=rate`)
  let items: { product: string; qty: number }[] = []
  try {
    items = JSON.parse(String(fd.get("items"))).slice(0, 20).map((i: any) => ({ product: String(i.product), qty: Math.max(1, Math.min(100, Math.floor(Number(i.qty)) || 1)) }))
  } catch {}
  if (!items.length) redirect(`${back}?error=empty`)
  const { data, error } = await createClient().rpc("place_order_checkout", {
    p_tenant: tenant, p_items: items,
    p_name: String(fd.get("name") || "").trim(), p_phone: String(fd.get("phone") || "").trim(),
    p_address: String(fd.get("address") || "").trim(), p_method: String(fd.get("method") || "later"),
    p_note: String(fd.get("note") || "").trim() || null, p_ref: cookies().get("ref")?.value ?? null,
  })
  if (error || !data) {
    const m = error?.message ?? ""
    redirect(`${back}?error=${/out of stock/i.test(m) ? "stock" : /method/i.test(m) ? "method" : /not found/i.test(m) ? "gone" : "invalid"}`)
  }
  redirect(`/s/${encodeURIComponent(slug)}/order/${(data as any).token}`)
}

// ลูกค้าแนบสลิปโอนเงิน
export async function uploadSlip(fd: FormData) {
  const slug = String(fd.get("slug")), token = String(fd.get("token"))
  const back = `/s/${encodeURIComponent(slug)}/order/${token}`
  if (!UUID.test(token)) redirect(back)
  if (await limited(`slip:${token}`, 6, 3600)) redirect(`${back}?slip=rate`)
  const sb = createClient()
  const [url] = await uploadImages(sb, "slips", token, fd.getAll("slip"), 1)
  if (!url) redirect(`${back}?slip=bad`)
  const { data } = await sb.rpc("submit_payment_slip", { p_token: token, p_url: url })
  revalidatePath(back)
  redirect(`${back}?slip=${data ? "ok" : "bad"}`)
}
