'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { T } from '@/components/Prefs'
import type { Tx } from '@/lib/i18n'
const ICON: Record<string, string> = {
  '/app/dashboard': '📊', '/app/products': '🛍️', '/app/pages': '📄', '/app/orders': '🧾', '/app/customers': '👥',
  '/app/inbox': '💬', '/app/ai': '🤖', '/app/live': '🎥', '/app/content': '✍️',
  '/app/nfc': '📡', '/app/referrals': '🔗', '/app/integrations': '🔌', '/app/settings': '⚙️',
}
export default function AppNav({ groups }: { groups: [Tx, [string, Tx][]][] }) {
  const path = usePathname()
  return (
    <nav className="mt-4 space-y-5" aria-label="เมนูหลัก">
      {groups.map(([group, items], gi) => (
        <div key={gi}>
          <p className="px-1 text-xs font-medium uppercase tracking-wider text-ink/50"><T {...group} /></p>
          <ul className="mt-2 space-y-2">
            {items.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="navbtn" aria-current={path === href || path.startsWith(href + '/') ? 'page' : undefined}>
                  <span className="ico" aria-hidden>{ICON[href] ?? '•'}</span><span><T {...label} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
