import { headers } from 'next/headers'
// ที่อยู่เว็บ (https://โดเมน ไม่มี / ท้าย) · ใช้ NEXT_PUBLIC_SITE_URL ถ้าตั้งไว้ ไม่ตั้งก็อ่านจากโดเมนที่ผู้ใช้เปิดอยู่จริง
export function siteOrigin(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, '')
  if (env) return env
  const h = headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}
