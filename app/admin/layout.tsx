import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarketingBackground from '@/components/MarketingBackground'
import { Controls } from '@/components/Prefs'
import { signOut } from '@/app/login/actions'
export const dynamic = 'force-dynamic'
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/login')
  const { data: ok } = await sb.rpc('is_platform_admin')
  if (ok !== true) redirect('/app/dashboard')
  return (
    <div className="dk"><MarketingBackground />
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header className="flex flex-wrap items-center gap-3">
          <Link href="/admin" className="text-lg font-bold">AI FutureX Tool <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">ADMIN</span></Link>
          <div className="ml-auto flex flex-wrap items-center gap-3"><Controls />
            <Link href="/app/dashboard" className="btn-ghost">ไปร้านของฉัน</Link>
            <form action={signOut}><button className="btn-ghost">ออกจากระบบ</button></form></div>
        </header>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}
