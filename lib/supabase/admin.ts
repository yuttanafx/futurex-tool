import { SUPABASE_URL } from '@/lib/supabase/env'
import { createClient } from '@supabase/supabase-js'
// ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น ห้าม import ใน client component
export const admin = () =>
  createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
