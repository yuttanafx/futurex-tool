import Link from 'next/link'
import AppNav from '@/components/AppNav'
import { signOut } from '@/app/login/actions'
import { getContext } from '@/lib/tenant'
import MarketingBackground from '@/components/MarketingBackground'
import { Controls, T } from '@/components/Prefs'
import type { Tx } from '@/lib/i18n'
export const dynamic = 'force-dynamic'
const tx = (th: string, en: string, zh: string): Tx => ({ th, en, zh })
const NAV: [Tx, [string, Tx][]][] = [
  [tx('ภาพรวม', 'Overview', '概览'), [['/app/dashboard', tx('แดชบอร์ด', 'Dashboard', '仪表盘')]]],
  [tx('ขาย', 'Sales', '销售'), [
    ['/app/products', tx('สินค้า', 'Products', '商品')], ['/app/pages', tx('เซลเพจ', 'Sales pages', '销售页')],
    ['/app/orders', tx('คำสั่งซื้อ', 'Orders', '订单')], ['/app/customers', tx('ลูกค้า', 'Customers', '客户')]]],
  [tx('AI และสื่อสาร', 'AI & Communication', 'AI 与沟通'), [
    ['/app/inbox', tx('กล่องข้อความ', 'Inbox', '收件箱')], ['/app/ai', tx('ผู้ช่วย AI', 'AI assistant', 'AI 助手')],
    ['/app/live', tx('ไลฟ์', 'Live', '直播')], ['/app/content', tx('คอนเทนต์', 'Content', '内容')],
    ['/app/adcontent', tx('ยิงแอด คอนเทนต์', 'Ad Content', '广告内容')]]],
  [tx('เครื่องมือ', 'Tools', '工具'), [
    ['/app/nfc', tx('NFC', 'NFC', 'NFC')], ['/app/referrals', tx('ลิงก์แนะนำ', 'Referrals', '推荐链接')],
    ['/app/integrations', tx('ช่องทาง', 'Channels', '渠道')], ['/app/settings', tx('ตั้งค่า', 'Settings', '设置')]]],
]
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { tenant, user, sb } = await getContext()
  const { data: isAdmin } = await sb.rpc('is_platform_admin')
  return (
    <div className="dk"><MarketingBackground /><div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row">
      <aside className="md:w-56 md:shrink-0">
        <Controls className="mb-4 flex-wrap" />
        <div className="card">
          <p className="text-xs text-ink/60">WORKSPACE</p>
          <strong className="block truncate">{tenant.name}</strong>
          <Link href={`/s/${tenant.slug}`} target="_blank" className="mt-2 block text-sm text-brand underline"><T th="ดูหน้าร้านของฉัน" en="View my shop" zh="查看我的店铺" /></Link>
        </div>
        <AppNav groups={NAV} />
        <div className="mt-6 border-t border-ink/10 pt-4">
          {isAdmin === true && <Link href="/admin" className="navbtn mb-2"><span className="ico" aria-hidden>🛡️</span><span><T th="ผู้ดูแลระบบ (Admin)" en="Platform admin" zh="平台管理" /></span></Link>}
          <p className="truncate px-1 text-xs text-ink/50" title={user.email ?? ''}>{user.email}</p>
          <form action={signOut} className="mt-2">
            <button type="submit" className="navbtn logout"><span className="ico" aria-hidden>🚪</span><span><T th="ออกจากระบบ" en="Log out" zh="退出登录" /></span></button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div></div>
  )
}
