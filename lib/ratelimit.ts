import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { admin } from '@/lib/supabase/admin'
// true = เกินกำหนด · เก็บเฉพาะค่าแฮชของ IP (ไม่เก็บ IP จริง) · ถ้าเช็กไม่ได้ให้ผ่าน
export async function limited(key: string, limit: number, windowSec: number) {
  try {
    const ip = (headers().get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown'
    const h = createHash('sha256').update(ip + (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')).digest('hex').slice(0, 24)
    const { data } = await admin().rpc('rate_hit', { p_key: `${key}:${h}`, p_limit: limit, p_window: windowSec })
    return data === false
  } catch { return false }
}
