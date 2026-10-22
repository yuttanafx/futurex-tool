import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase/env'
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data } = await sb.from('tenants').select('slug').eq('status', 'active').limit(5000)
  return [{ url: base }, ...(data ?? []).map((t) => ({ url: `${base}/s/${encodeURIComponent(t.slug)}` }))]
}
