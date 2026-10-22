import { admin } from '@/lib/supabase/admin'
// ตรวจโควตา → เรียก OpenAI → บันทึกการใช้งาน (ฝั่งเซิร์ฟเวอร์เท่านั้น)
export async function generate(tenant: string, system: (ctx: any) => string, user: string): Promise<{ text?: string; error?: string }> {
  const key = process.env.OPENAI_API_KEY
  if (!key || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { error: 'not_configured' }
  const a = admin()
  const { data: ctx } = await a.rpc('ai_begin', { t: tenant })
  if (!ctx?.ok) return { error: ctx?.reason ?? 'unavailable' }
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, max_completion_tokens: 900, messages: [{ role: 'system', content: system(ctx) }, { role: 'user', content: user }] }),
  })
  if (!r.ok) return { error: 'ai_failed' }
  const j = await r.json()
  await a.from('ai_usage').insert({ tenant_id: tenant, model, usage_units: j.usage?.total_tokens ?? 0 })
  return { text: j.choices?.[0]?.message?.content?.trim() || undefined, error: j.choices?.[0]?.message?.content ? undefined : 'ai_failed' }
}
