import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getContext } from '@/lib/tenant'
import { admin } from '@/lib/supabase/admin'
async function connect(fd: FormData) {
  'use server'
  const { tenant, role } = await getContext()
  const secret = String(fd.get('secret') || '').trim()
  if (!['owner', 'admin'].includes(role) || !secret) return
  const sb = admin()
  await sb.from('integration_secrets').upsert({ tenant_id: tenant.id, provider: 'line', secret })
  await sb.from('integrations').upsert({ tenant_id: tenant.id, provider: 'line', status: 'connected' })
  revalidatePath('/app/integrations')
}
export default async function Integrations() {
  const { sb, tenant } = await getContext()
  const { data } = await sb.from('integrations').select('provider,status').eq('provider', 'line').maybeSingle()
  const host = headers().get('host')
  return (
    <>
      <h1 className="text-2xl font-bold">เชื่อมต่อช่องทาง</h1>
      <h2 className="mt-6 text-lg font-bold">LINE Official Account {data && <span className="text-sm font-normal text-brand">· เชื่อมแล้ว</span>}</h2>
      <p className="mt-2 text-sm text-ink/70">ข้อความที่ลูกค้าส่งเข้า LINE จะเข้ามาที่หน้า AI ของคุณ (รับข้อความอย่างเดียว ยังไม่ตอบกลับอัตโนมัติ)</p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
        <li>ใน LINE Developers → Messaging API ตั้ง Webhook URL เป็น <code className="break-all">https://{host}/api/v1/webhooks/line/{tenant.id}</code> แล้วเปิด Use webhook</li>
        <li>คัดลอก Channel secret (แท็บ Basic settings) มาวางด้านล่าง ระบบเก็บแยกจากข้อมูลทั่วไปและไม่แสดงกลับ</li>
      </ol>
      <form action={connect} className="mt-4 flex gap-2">
        <input name="secret" type="password" required autoComplete="off" placeholder="Channel secret" aria-label="Channel secret" className="input" />
        <button className="btn">บันทึก</button>
      </form>
    </>
  )
}
