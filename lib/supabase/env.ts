// อ่านได้ทั้งชื่อที่ตั้งเอง (NEXT_PUBLIC_*) และชื่อที่ Vercel Supabase Integration สร้างให้ (SUPABASE_URL / SUPABASE_ANON_KEY)
// ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น
export const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)!
export const SUPABASE_ANON_KEY = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!
