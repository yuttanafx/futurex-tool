import { admin } from '@/lib/supabase/admin'
import { decryptKey, encryptKey, keysConfigured } from '@/lib/aikeys'
// Facebook Graph API (ฝั่งเซิร์ฟเวอร์เท่านั้น) · token ของเพจเก็บเข้ารหัสด้วย AI_KEY_SECRET เหมือน API key ของ AI
const VER = process.env.FB_GRAPH_VERSION || 'v23.0'
export const GRAPH = `https://graph.facebook.com/${VER}`
export const FB_DIALOG = `https://www.facebook.com/${VER}/dialog/oauth`
export const FB_SCOPES = 'pages_show_list,pages_manage_posts,pages_read_engagement,pages_manage_metadata,pages_messaging'
export const fbOauthConfigured = () => Boolean(process.env.FB_APP_ID && process.env.FB_APP_SECRET)
export const fbStorable = () => keysConfigured()

export class FbError extends Error { constructor(public code: 'token' | 'perm' | 'rate' | 'window' | 'upstream' | 'timeout') { super(code) } }
function codeFor(status: number, j: any): FbError['code'] {
  const c = j?.error?.code
  if (c === 190 || status === 401) return 'token'
  if (c === 10 || c === 200 || (c >= 200 && c < 300) || status === 403) return 'perm'
  if (c === 4 || c === 17 || c === 32 || c === 613) return 'rate'
  if (c === 551 || j?.error?.error_subcode === 2018278) return 'window'
  return 'upstream'
}
async function call(path: string, o: { method?: 'GET' | 'POST'; token?: string; params?: Record<string, string>; body?: unknown } = {}) {
  const url = new URL(path.startsWith('http') ? path : `${GRAPH}${path}`)
  for (const [k, v] of Object.entries(o.params ?? {})) url.searchParams.set(k, v)
  let r: Response
  try {
    r = await fetch(url, {
      method: o.method ?? 'GET', cache: 'no-store', signal: AbortSignal.timeout(20_000),
      headers: { ...(o.token ? { Authorization: `Bearer ${o.token}` } : {}), ...(o.body ? { 'Content-Type': 'application/json' } : {}) },
      body: o.body ? JSON.stringify(o.body) : undefined,
    })
  } catch { throw new FbError('timeout') }
  const j: any = await r.json().catch(() => ({}))
  if (!r.ok || j?.error) throw new FbError(codeFor(r.status, j)) // ไม่ส่งเนื้อหา error/token ออกไป
  return j
}

export type FbPage = { id: string; name: string; category?: string; picture?: string; token: string }
const pic = (p: any): string | undefined => p?.picture?.data?.url

/** ตรวจ Page Access Token (ต้องเป็น token ของเพจ ไม่ใช่ของผู้ใช้) */
export async function pageFromToken(token: string): Promise<FbPage> {
  const j = await call('/me', { token, params: { fields: 'id,name,category,picture{url}' } })
  if (!j.id || !j.category) throw new FbError('token')
  return { id: String(j.id), name: String(j.name), category: j.category, picture: pic(j), token }
}
export async function exchangeCode(code: string, redirectUri: string): Promise<string> {
  const base = { client_id: process.env.FB_APP_ID!, client_secret: process.env.FB_APP_SECRET!, redirect_uri: redirectUri }
  const a = await call('/oauth/access_token', { params: { ...base, code } })
  const b = await call('/oauth/access_token', { params: { grant_type: 'fb_exchange_token', client_id: base.client_id, client_secret: base.client_secret, fb_exchange_token: a.access_token } })
  return String(b.access_token)
}
/** เพจที่ผู้ใช้อนุญาตในหน้า Login (token ของเพจที่ได้จาก long-lived user token ไม่มีวันหมดอายุ) */
export async function listPages(userToken: string): Promise<FbPage[]> {
  const j = await call('/me/accounts', { token: userToken, params: { fields: 'id,name,category,picture{url},access_token', limit: '100' } })
  return (j.data ?? []).filter((p: any) => p.id && p.access_token).map((p: any) => ({ id: String(p.id), name: String(p.name), category: p.category, picture: pic(p), token: String(p.access_token) }))
}
export async function subscribePage(pageId: string, token: string) {
  await call(`/${encodeURIComponent(pageId)}/subscribed_apps`, { method: 'POST', token, params: { subscribed_fields: 'messages,messaging_postbacks' } })
}
export async function publishPost(pageId: string, token: string, message: string): Promise<string> {
  const j = await call(`/${encodeURIComponent(pageId)}/feed`, { method: 'POST', token, body: { message } })
  return String(j.id ?? '')
}
export async function sendMessage(token: string, psid: string, text: string) {
  await call('/me/messages', { method: 'POST', token, body: { recipient: { id: psid }, messaging_type: 'RESPONSE', message: { text: text.slice(0, 1900) } } })
}

/** บันทึกเพจ + token (ถ้าเพจนี้ผูกกับร้านอื่นแล้วจะไม่ทับ) */
export async function savePage(tenantId: string, p: FbPage): Promise<'ok' | 'taken'> {
  const a = admin()
  const { data: ex } = await a.from('fb_pages').select('tenant_id').eq('page_id', p.id).maybeSingle()
  if (ex && ex.tenant_id !== tenantId) return 'taken'
  const meta = { name: p.name, category: p.category ?? null, picture_url: p.picture ?? null }
  const { error: e1 } = ex
    ? await a.from('fb_pages').update(meta).eq('page_id', p.id).eq('tenant_id', tenantId)
    : await a.from('fb_pages').insert({ tenant_id: tenantId, page_id: p.id, ...meta })
  if (e1) throw new Error('save page failed')
  const { error: e2 } = await a.from('fb_page_tokens').upsert({ page_id: p.id, tenant_id: tenantId, enc: encryptKey(p.token), updated_at: new Date().toISOString() })
  if (e2) throw new Error('save token failed')
  return 'ok'
}
export async function pageToken(tenantId: string, pageId: string): Promise<string | null> {
  if (!keysConfigured()) return null
  const { data } = await admin().from('fb_page_tokens').select('enc').eq('page_id', pageId).eq('tenant_id', tenantId).maybeSingle()
  if (!data) return null
  try { return decryptKey(data.enc) } catch { return null }
}
export const FB_ERR: Record<string, string> = {
  token: 'Token ของเพจใช้ไม่ได้/หมดอายุ ลองเชื่อมเพจใหม่', perm: 'ไม่มีสิทธิ์ที่จำเป็น (ต้องอนุญาต pages_manage_posts / pages_messaging)',
  rate: 'Facebook จำกัดความถี่ ลองใหม่ภายหลัง', window: 'เกิน 24 ชั่วโมงหลังลูกค้าทักล่าสุด ตอบทางแชทไม่ได้', upstream: 'Facebook ตอบกลับผิดพลาด ลองใหม่', timeout: 'เชื่อมต่อ Facebook ไม่ได้ ลองใหม่',
}
