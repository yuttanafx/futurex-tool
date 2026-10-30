import { redirect } from 'next/navigation'
import { getContext } from '@/lib/tenant'
import { admin } from '@/lib/supabase/admin'
import { limited } from '@/lib/ratelimit'
import { T } from '@/components/Prefs'
import { PROVIDERS, PROVIDER_IDS, encryptKey, isProvider, keysConfigured, tenantAi, type Provider } from '@/lib/aikeys'
import { complete, LlmError } from '@/lib/llm'
import type { Tx } from '@/lib/i18n'

const tx = (th: string, en: string, zh: string): Tx => ({ th, en, zh })
const OK: Record<string, Tx> = {
  saved: tx('บันทึกแล้ว', 'Saved', '已保存'),
  removed: tx('ลบ key แล้ว', 'Key removed', '已删除密钥'),
  tested: tx('ทดสอบผ่าน: key ใช้งานได้', 'Test passed: the key works', '测试通过：密钥可用'),
}
const ERR: Record<string, Tx> = {
  invalid_key: tx('API key ไม่ถูกต้อง (ต้องยาวอย่างน้อย 10 ตัวอักษรและไม่มีช่องว่าง)', 'Invalid API key (at least 10 characters, no spaces)', 'API 密钥无效（至少 10 个字符，且不含空格）'),
  forbidden: tx('เฉพาะเจ้าของ/แอดมินร้านเท่านั้นที่แก้ได้', 'Only the shop owner/admin can change this', '仅店主/管理员可修改'),
  no_secret: tx('เซิร์ฟเวอร์ยังไม่ได้ตั้งค่า AI_KEY_SECRET จึงบันทึก key ไม่ได้', 'The server has no AI_KEY_SECRET set, so keys cannot be saved', '服务器尚未设置 AI_KEY_SECRET，无法保存密钥'),
  rate: tx('ทำรายการถี่เกินไป รอสักครู่', 'Too many attempts, please wait', '操作过于频繁，请稍后'),
  no_key: tx('ยังไม่มี key ของผู้ให้บริการนี้', 'No key saved for this provider', '该服务商尚未保存密钥'),
  bad_key: tx('ผู้ให้บริการปฏิเสธ: key ไม่ถูกต้อง/หมดสิทธิ์ หรือยังไม่ได้เปิดใช้งานบัญชี', 'The provider rejected the request: invalid key, no access, or the account is not enabled', '服务商拒绝：密钥无效/无权限或账户未启用'),
  bad_model: tx('ไม่พบโมเดลที่ระบุ ตรวจชื่อโมเดล (หรือเว้นว่างเพื่อใช้ค่าแนะนำ)', 'Model not found. Check the model name (or leave blank for the default)', '找不到该模型。请检查模型名称（或留空使用默认值）'),
  provider_quota: tx('ผู้ให้บริการแจ้งว่าใช้เกินโควตาหรือเรียกถี่เกินไป ตรวจเครดิตในบัญชีของคุณ', 'The provider reports quota exceeded or rate limit. Check your account credit', '服务商提示超出配额或请求过频，请检查账户额度'),
  timeout: tx('เชื่อมต่อผู้ให้บริการไม่ได้หรือช้าเกินไป ลองใหม่', 'Could not reach the provider or it timed out. Try again', '无法连接服务商或超时，请重试'),
  ai_failed: tx('ผู้ให้บริการขัดข้องชั่วคราว ลองใหม่', 'The provider had a temporary error. Try again', '服务商暂时出错，请重试'),
}
const back = (k: 'm' | 'e', v: string): never => redirect(`/app/ai-keys?${k}=${v}`)

async function guard() {
  const { tenant, role } = await getContext()
  if (!['owner', 'admin'].includes(role)) back('e', 'forbidden')
  if (!keysConfigured()) back('e', 'no_secret')
  if (await limited(`aikeys:${tenant.id}`, 30, 600)) back('e', 'rate')
  return tenant
}

async function save(fd: FormData) {
  'use server'
  const tenant = await guard()
  const provider = fd.get('provider')
  if (!isProvider(provider)) return
  const key = String(fd.get('key') || '').trim()
  const model = String(fd.get('model') || '').trim().slice(0, 80)
  if (model && !/^[A-Za-z0-9._:/-]+$/.test(model)) back('e', 'bad_model')
  const a = admin()
  if (key) {
    if (key.length < 10 || key.length > 400 || /\s/.test(key)) back('e', 'invalid_key')
    await a.from('tenant_ai_keys').upsert({ tenant_id: tenant.id, provider, enc: encryptKey(key), last4: key.slice(-4), updated_at: new Date().toISOString() })
  } else {
    const { data } = await a.from('tenant_ai_keys').select('provider').eq('tenant_id', tenant.id).eq('provider', provider).maybeSingle()
    if (!data) back('e', 'no_key')
  }
  await a.from('tenant_ai_prefs').upsert({ tenant_id: tenant.id, provider, model, updated_at: new Date().toISOString() })
  back('m', 'saved')
}

async function remove(fd: FormData) {
  'use server'
  const tenant = await guard()
  const provider = fd.get('provider')
  if (!isProvider(provider)) return
  const a = admin()
  await a.from('tenant_ai_keys').delete().eq('tenant_id', tenant.id).eq('provider', provider)
  await a.from('tenant_ai_prefs').delete().eq('tenant_id', tenant.id).eq('provider', provider)
  back('m', 'removed')
}

async function test() {
  'use server'
  const tenant = await guard()
  const own = await tenantAi(tenant.id)
  if (!own) back('e', 'no_key')
  try {
    await complete({ ...own!, system: 'Reply with the single word OK.', messages: [{ role: 'user', content: 'ping' }], maxTokens: 16 })
  } catch (e) {
    back('e', e instanceof LlmError && e.code !== 'empty' ? (e.code === 'upstream' ? 'ai_failed' : e.code) : 'ai_failed')
  }
  back('m', 'tested')
}

export default async function AiKeys({ searchParams }: { searchParams: { m?: string; e?: string } }) {
  const { tenant, role, sb } = await getContext()
  const a = admin()
  const [{ data: keys }, { data: prefs }, { data: q }] = await Promise.all([
    a.from('tenant_ai_keys').select('provider,last4').eq('tenant_id', tenant.id),
    a.from('tenant_ai_prefs').select('provider,model').eq('tenant_id', tenant.id).maybeSingle(),
    sb.rpc('ai_quota', { t: tenant.id }),
  ])
  const canEdit = ['owner', 'admin'].includes(role)
  const ready = keysConfigured()
  const active: Provider | null = (keys ?? []).find((k) => k.provider === prefs?.provider)?.provider as Provider | undefined ?? (keys?.length === 1 ? (keys[0].provider as Provider) : null)
  const platformFallback = process.env.AI_PLATFORM_FALLBACK === '1' && Boolean(process.env.OPENAI_API_KEY)

  return (
    <>
      <h1 className="text-2xl font-bold"><T th="ตั้งค่า API ของ AI" en="AI API keys" zh="AI API 密钥" /></h1>
      <p className="mt-2 text-sm text-ink/70">
        <T
          th="ใส่ API key ของ Claude, GPT หรือ Gemini ของร้านคุณเอง ระบบจะใช้ key นี้กับทุกฟีเจอร์ AI: คลังคอนเทนต์ ผู้ช่วยตอบแชทบนหน้าร้าน และผู้ช่วยไลฟ์ ค่าใช้จ่ายเป็นของบัญชีผู้ให้บริการของคุณ ระบบเก็บ key แบบเข้ารหัสและไม่แสดงกลับ"
          en="Add your own Claude, GPT or Gemini API key. It is used by every AI feature: the content library, the storefront chat assistant and the live assistant. Usage is billed to your own provider account. Keys are stored encrypted and never shown again."
          zh="填入您自己的 Claude、GPT 或 Gemini API 密钥，所有 AI 功能（内容库、店铺聊天助手、直播助手）都会使用它。费用由您自己的服务商账户承担。密钥加密存储，不会再次显示。"
        />
      </p>

      <p className="mt-3 rounded-md bg-ink/5 p-3 text-sm">
        {active ? (
          <T th={`ตอนนี้ใช้: ${PROVIDERS[active].label} (key ของร้านคุณ · ไม่นับเข้าโควตาแพ็กเกจ)`} en={`Currently using: ${PROVIDERS[active].label} (your own key · not counted against your plan quota)`} zh={`当前使用：${PROVIDERS[active].label}（您自己的密钥 · 不计入套餐额度）`} />
        ) : platformFallback ? (
          <T th={`ตอนนี้ใช้ AI ของระบบกลาง วันนี้ใช้ไป ${q?.used ?? 0} จาก ${q?.limit ?? 0} ข้อความ ใส่ key ของคุณเพื่อไม่จำกัดตามโควตานี้`} en={`Currently using the platform's shared AI: ${q?.used ?? 0} of ${q?.limit ?? 0} messages used today. Add your own key to go beyond this quota.`} zh={`当前使用平台共享 AI：今日已用 ${q?.used ?? 0} / ${q?.limit ?? 0} 条。添加自己的密钥可不受此额度限制。`} />
        ) : (
          <T th="ยังไม่ได้ตั้งค่า: ฟีเจอร์ AI จะใช้งานไม่ได้จนกว่าจะใส่ API key อย่างน้อย 1 ตัว" en="Not set up yet: AI features will not work until you add at least one API key." zh="尚未设置：添加至少一个 API 密钥后 AI 功能才可使用。" />
        )}
      </p>

      {searchParams.m && OK[searchParams.m] && <p role="status" className="mt-3 rounded-md bg-brand/15 p-3 text-sm"><T {...OK[searchParams.m]} /></p>}
      {searchParams.e && ERR[searchParams.e] && <p role="alert" className="mt-3 rounded-md bg-sun/30 p-3 text-sm"><T {...ERR[searchParams.e]} /></p>}
      {!ready && <p role="alert" className="mt-3 rounded-md bg-sun/30 p-3 text-sm"><T {...ERR.no_secret} /></p>}
      {!canEdit && <p className="mt-3 text-sm text-ink/60"><T th="คุณดูได้อย่างเดียว เฉพาะเจ้าของ/แอดมินร้านที่แก้ไขได้" en="View only. Only the shop owner/admin can edit." zh="仅可查看，只有店主/管理员可编辑。" /></p>}

      <div className="mt-6 grid gap-4">
        {PROVIDER_IDS.map((p) => {
          const k = keys?.find((x) => x.provider === p)
          const info = PROVIDERS[p]
          return (
            <section key={p} className="card">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold">{info.label}</h2>
                <span className="text-sm">
                  {k ? <span className="text-brand">✓ <T th="ตั้งแล้ว" en="Saved" zh="已保存" /> •••• {k.last4}</span> : <span className="text-ink/50"><T th="ยังไม่ได้ตั้ง" en="Not set" zh="未设置" /></span>}
                  {active === p && <span className="ml-2 rounded-full bg-brand/15 px-2 py-0.5 text-xs"><T th="ใช้อยู่" en="In use" zh="使用中" /></span>}
                </span>
              </div>
              <form action={save} className="mt-3 grid gap-3 md:grid-cols-[2fr_1.5fr_auto]">
                <input type="hidden" name="provider" value={p} />
                <label className="block text-sm"><T th="API key" en="API key" zh="API 密钥" /> · <a href={info.keyUrl} target="_blank" rel="noopener noreferrer" className="underline text-brand"><T th="สร้าง key ที่นี่" en="get a key" zh="获取密钥" /></a>
                  <input name="key" type="password" autoComplete="off" disabled={!canEdit || !ready} placeholder={k ? '•••••••• (เว้นว่างเพื่อใช้ key เดิม)' : info.hint} className="input mt-1" />
                </label>
                <label className="block text-sm"><T th="โมเดล (ไม่บังคับ)" en="Model (optional)" zh="模型（可选）" />
                  <input name="model" maxLength={80} disabled={!canEdit || !ready} defaultValue={prefs?.provider === p ? prefs.model : ''} placeholder={info.model} className="input mt-1" />
                </label>
                <div className="flex items-end"><button className="btn" disabled={!canEdit || !ready}><T th="บันทึกและใช้ตัวนี้" en="Save & use this" zh="保存并使用" /></button></div>
              </form>
              {k && canEdit && (
                <form action={remove} className="mt-2">
                  <input type="hidden" name="provider" value={p} />
                  <button className="text-sm underline text-ink/60"><T th="ลบ key นี้" en="Remove this key" zh="删除此密钥" /></button>
                </form>
              )}
            </section>
          )
        })}
      </div>

      {active && canEdit && (
        <form action={test} className="mt-6">
          <button className="btn-ghost"><T th="ทดสอบ key ที่ใช้อยู่" en="Test the active key" zh="测试当前密钥" /></button>
          <span className="ml-3 text-xs text-ink/60"><T th="ส่งข้อความสั้นๆ 1 ครั้งเพื่อเช็กว่า key ใช้ได้" en="Sends one tiny message to check the key works" zh="发送一条极短消息以检查密钥是否可用" /></span>
        </form>
      )}
    </>
  )
}
