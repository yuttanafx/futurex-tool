import Link from 'next/link'
import { T } from '@/components/Prefs'
import AiFrame from './AiFrame'
import { revalidatePath } from 'next/cache'
import { getContext } from '@/lib/tenant'

async function save(fd: FormData) {
  'use server'
  const { sb, tenant } = await getContext()
  await sb.from('ai_agents').upsert({
    tenant_id: tenant.id, enabled: fd.get('enabled') === 'on',
    instructions: String(fd.get('instructions') || '').slice(0, 2000), updated_at: new Date().toISOString(),
  })
  revalidatePath('/app/ai')
}

const SRC = process.env.NEXT_PUBLIC_AI_PLATFORM_URL || 'https://skills-hub-ebon.vercel.app/'

export default async function AI() {
  const { sb, tenant } = await getContext()
  const [{ data: agent }, { data: q }, { data: msgs }] = await Promise.all([
    sb.from('ai_agents').select('enabled,instructions').eq('tenant_id', tenant.id).maybeSingle(),
    sb.rpc('ai_quota', { t: tenant.id }),
    sb.from('messages').select('id,sender_type,content,created_at').order('created_at', { ascending: false }).limit(30),
  ])
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          <T th="ผู้ช่วย AI" en="AI assistant" zh="AI 助手" />
        </h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/ai-keys" className="btn-ghost">
            <T th="ตั้งค่า API ของ AI" en="AI API keys" zh="AI API 密钥" />
          </Link>
          <a href={SRC} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            <T th="เปิดในแท็บใหม่ ↗" en="Open in new tab ↗" zh="在新标签页打开 ↗" />
          </a>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink/60">
        <T
          th="ใช้งานผู้ช่วย AI ในกรอบนี้ได้เลย ถ้ากรอบว่างหรือเข้าไม่ได้ (เช่น Safari / iPhone) ให้กดปุ่มด้านบนกรอบเพื่อสลับเป็นลิงก์"
          en="Use the AI assistant right here. If the frame is blank or won't sign in (e.g. Safari / iPhone), use the button above the frame to switch to a link."
          zh="可直接在此框内使用 AI 助手。若框内空白或无法登录（如 Safari / iPhone），请点框上方按钮改用链接。"
        />
      </p>
      <AiFrame src={SRC} />

      <section className="mt-10 border-t border-ink/10 pt-6">
        <h2 className="text-lg font-bold">
          <T th="ตั้งค่าผู้ช่วยบนหน้าร้าน" en="Storefront assistant settings" zh="店铺助手设置" />
        </h2>
        <p className="mt-2 text-sm text-ink/70">
          <T
            th={`วันนี้ใช้ไปแล้ว ${q?.used ?? 0} จาก ${q?.limit ?? 0} ข้อความ AI ตอบจากสินค้าที่แสดงอยู่ในร้านเท่านั้น`}
            en={`Used ${q?.used ?? 0} of ${q?.limit ?? 0} AI messages today. The AI answers only from products shown in your shop.`}
            zh={`今天已用 ${q?.used ?? 0} / ${q?.limit ?? 0} 条 AI 消息。AI 仅根据店内展示的商品回答。`}
          />
        </p>
        <form action={save} className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" defaultChecked={agent?.enabled ?? true} />
            <T th="เปิดใช้ผู้ช่วยบนหน้าร้าน เพื่อให้ลูกค้าแชทกับ AI ได้" en="Enable the storefront assistant so customers can chat with AI" zh="开启店铺助手，让顾客与 AI 聊天" />
          </label>
          <label className="block text-sm">
            <T th="คำแนะนำถึง AI (น้ำเสียง จุดขาย เรื่องที่ไม่ควรตอบ)" en="Instructions for the AI (tone, selling points, topics to avoid)" zh="给 AI 的指示（语气、卖点、不应回答的内容）" />
            <textarea
              name="instructions"
              rows={5}
              maxLength={2000}
              defaultValue={agent?.instructions ?? ''}
              className="input mt-1"
              placeholder="เช่น พูดเป็นกันเอง ลงท้ายด้วยค่ะ ส่งฟรีเมื่อซื้อครบ 500 บาท"
            />
          </label>
          <button className="btn"><T th="บันทึก" en="Save" zh="保存" /></button>
        </form>

        <h3 className="mt-8 text-base font-bold"><T th="ข้อความล่าสุดที่ลูกค้าถาม" en="Latest customer messages" zh="顾客最新消息" /></h3>
        <ul className="mt-3 space-y-2">
          {!msgs?.length && (
            <li className="text-sm text-ink/60">
              <T th="ยังไม่มีบทสนทนา เมื่อลูกค้าถามผ่านหน้าร้าน ข้อความจะขึ้นที่นี่" en="No conversations yet. Customer questions from your shop will appear here." zh="暂无对话。顾客通过店铺提问后会显示在这里。" />
            </li>
          )}
          {msgs?.map((m) => (
            <li key={m.id} className="text-sm">
              <span className="text-ink/60">{m.sender_type === 'ai' ? 'AI' : <T th="ลูกค้า" en="Customer" zh="顾客" />}:</span> {m.content}
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
