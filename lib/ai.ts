import { admin } from '@/lib/supabase/admin'
import { tenantAi } from '@/lib/aikeys'
import { complete, LlmError, type Msg } from '@/lib/llm'

// ตรวจสิทธิ์/โควตา → เรียก AI ด้วย key ของร้าน (ถ้าไม่มี และเปิด AI_PLATFORM_FALLBACK=1 ใช้ OPENAI_API_KEY ของแพลตฟอร์มเป็นตัวสำรอง) → ส่งผลกลับ (ฝั่งเซิร์ฟเวอร์เท่านั้น)
// error: not_configured | no_key | not_found | disabled | quota | bad_key | bad_model | provider_quota | timeout | ai_failed
export type AiOk = { ok: true; text: string; ctx: any; model: string; units: number; byok: boolean }
export type AiFail = { ok: false; error: string }

export async function runAi(
  tenant: string, system: (ctx: any) => string, messages: Msg[], opts: { maxTokens: number; json?: boolean },
): Promise<AiOk | AiFail> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: false, error: 'not_configured' }
  let own = null
  try { own = await tenantAi(tenant) } catch (e) { console.error('tenantAi failed:', e instanceof Error ? e.message : e) }
  // ค่าเริ่มต้น: แต่ละร้านต้องใช้ key ของตัวเองเท่านั้น (ไม่ใช้ key กลาง) เปิดตัวสำรองได้ด้วย AI_PLATFORM_FALLBACK=1 + OPENAI_API_KEY
  const platformKey = process.env.AI_PLATFORM_FALLBACK === '1' ? process.env.OPENAI_API_KEY : undefined
  if (!own && !platformKey) return { ok: false, error: 'no_key' }

  const a = admin()
  const { data: ctx } = own ? await a.rpc('ai_begin', { t: tenant, byok: true }) : await a.rpc('ai_begin', { t: tenant })
  if (!ctx?.ok) return { ok: false, error: ctx?.reason ?? 'unavailable' }

  const use = own ?? { provider: 'openai' as const, key: platformKey!, model: process.env.OPENAI_MODEL || 'gpt-4o-mini' }
  try {
    const r = await complete({ ...use, system: system(ctx), messages, maxTokens: opts.maxTokens, json: opts.json })
    return { ok: true, text: r.text, ctx, model: use.model, units: r.units, byok: Boolean(own) }
  } catch (e) {
    if (e instanceof LlmError && e.code !== 'upstream' && e.code !== 'empty') return { ok: false, error: e.code }
    return { ok: false, error: 'ai_failed' }
  }
}

export async function recordUsage(tenant: string, r: AiOk) {
  await admin().from('ai_usage').insert({ tenant_id: tenant, model: r.model, usage_units: r.units, ...(r.byok ? { byok: true } : {}) })
}

// ใช้กับหน้าคลังคอนเทนต์
export async function generate(tenant: string, system: (ctx: any) => string, user: string): Promise<{ text?: string; error?: string }> {
  const r = await runAi(tenant, system, [{ role: 'user', content: user }], { maxTokens: 900 })
  if (!r.ok) return { error: r.error }
  await recordUsage(tenant, r)
  return { text: r.text }
}
