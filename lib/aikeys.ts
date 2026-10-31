import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { admin } from '@/lib/supabase/admin'
// ฝั่งเซิร์ฟเวอร์เท่านั้น: เข้ารหัส/ถอดรหัส API key ของร้าน (ห้าม import ใน client component)

export type Provider = 'gemini' | 'anthropic' | 'openai'
export const PROVIDER_IDS: Provider[] = ['gemini', 'anthropic', 'openai']
export const PROVIDERS: Record<Provider, { label: string; model: string; keyUrl: string; hint: string }> = {
  gemini: { label: 'Google Gemini', model: 'gemini-3.8-flash', keyUrl: 'https://aistudio.google.com/apikey', hint: 'AIza…' },
  anthropic: { label: 'Anthropic Claude', model: 'claude-sonnet-5-5', keyUrl: 'https://console.anthropic.com/settings/keys', hint: 'sk-ant-…' },
  openai: { label: 'OpenAI GPT', model: 'gpt-6-luna', keyUrl: 'https://platform.openai.com/api-keys', hint: 'sk-…' },
}
export const isProvider = (v: unknown): v is Provider => typeof v === 'string' && (PROVIDER_IDS as string[]).includes(v)

function secret(): Buffer | null {
  const s = process.env.AI_KEY_SECRET
  if (!s || s.length < 16) return null
  return createHash('sha256').update('fx-ai-keys:' + s).digest()
}
export const keysConfigured = () => secret() !== null

export function encryptKey(plain: string): string {
  const k = secret()
  if (!k) throw new Error('AI_KEY_SECRET not set')
  const iv = randomBytes(12)
  const c = createCipheriv('aes-256-gcm', k, iv)
  const ct = Buffer.concat([c.update(plain, 'utf8'), c.final()])
  return [iv, c.getAuthTag(), ct].map((b) => b.toString('base64')).join('.')
}
export function decryptKey(blob: string): string {
  const k = secret()
  if (!k) throw new Error('AI_KEY_SECRET not set')
  const [iv, tag, ct] = blob.split('.').map((p) => Buffer.from(p, 'base64'))
  const d = createDecipheriv('aes-256-gcm', k, iv)
  d.setAuthTag(tag)
  return Buffer.concat([d.update(ct), d.final()]).toString('utf8')
}

/** key + ผู้ให้บริการที่ร้านเลือกไว้ (ถ้ายังไม่ได้เลือกแต่มี key เดียว จะใช้ตัวนั้น) · ไม่มี key = null */
export async function tenantAi(tenantId: string): Promise<{ provider: Provider; key: string; model: string } | null> {
  if (!keysConfigured()) return null
  const a = admin()
  const [{ data: prefs }, { data: rows }] = await Promise.all([
    a.from('tenant_ai_prefs').select('provider,model').eq('tenant_id', tenantId).maybeSingle(),
    a.from('tenant_ai_keys').select('provider,enc').eq('tenant_id', tenantId),
  ])
  if (!rows?.length) return null
  const row = rows.find((r) => r.provider === prefs?.provider) ?? (rows.length === 1 ? rows[0] : null)
  if (!row || !isProvider(row.provider)) return null
  const model = row.provider === prefs?.provider ? prefs?.model || '' : ''
  return { provider: row.provider, key: decryptKey(row.enc), model: model || PROVIDERS[row.provider].model }
}
