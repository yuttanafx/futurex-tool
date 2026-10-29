import Link from 'next/link'
import { T } from '@/components/Prefs'
import type { Tx } from '@/lib/i18n'
export const metadata = { title: 'ตัวอย่างเซลเพจ · AI FutureX Tool' }

// ร้านตัวอย่างจริง (สินค้า FutureX) · เปลี่ยนร้านที่ชี้ได้ด้วย NEXT_PUBLIC_DEMO_SHOP (slug ของร้าน)
const DEMO = process.env.NEXT_PUBLIC_DEMO_SHOP || 'tve-1vam'
const DEMO_HREF = `/s/${encodeURIComponent(DEMO)}`
const DEMO_IMAGES = [
  'https://static.wixstatic.com/media/11e8bf_3aefa9fb34e64b33a15ff10c76265d57~mv2.png', // YANEA
  'https://static.wixstatic.com/media/11e8bf_0ada9828ccbf480584fa7c4635ba6fd1~mv2.png', // SANEA
  'https://static.wixstatic.com/media/11e8bf_3fe57a8fd35b446ea61c75be7fe0bbca~mv2.png', // PROM PORM
]

const X: [Tx, Tx][] = [
  [{ th: 'ตัวแทนขายตรง', en: 'Direct-sales agent', zh: '直销代理' }, { th: 'ลิงก์แนะนำและนามบัตร NFC', en: 'Referral links and NFC card', zh: '推荐链接和 NFC 名片' }],
  [{ th: 'ร้านเสื้อผ้าออนไลน์', en: 'Online clothing store', zh: '网上服装店' }, { th: 'แกลเลอรีสินค้าและแชท AI', en: 'Product gallery and AI chat', zh: '商品展示和 AI 聊天' }],
]

export default function Templates() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold"><T th="ตัวอย่างเซลเพจ" en="Sales page examples" zh="销售页示例" /></h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Link href={DEMO_HREF} className="card block transition hover:shadow-lg md:col-span-3 md:grid md:grid-cols-[1.2fr_1fr] md:gap-6">
          <div className="grid grid-cols-3 gap-2">
            {DEMO_IMAGES.map((u) => (
              <div key={u} className="aspect-square overflow-hidden rounded-lg bg-mist"><img src={u} alt="" loading="lazy" className="h-full w-full object-cover" /></div>
            ))}
          </div>
          <div className="mt-4 md:mt-0 md:self-center">
            <span className="rounded-full bg-mist px-2 py-0.5 text-xs"><T th="ร้านตัวอย่างจริง" en="Live demo shop" zh="真实示例店铺" /></span>
            <h2 className="mt-2 text-xl font-bold"><T th="ร้านสินค้าเพื่อสุขภาพ (FutureX)" en="Health products shop (FutureX)" zh="健康产品店（FutureX）" /></h2>
            <p className="mt-1 text-sm text-ink/70"><T th="หน้าแนะนำสินค้า ตะกร้า ชำระเงิน และแชท AI ใช้งานได้จริง" en="Product pages, cart, checkout and AI chat that really work" zh="商品介绍页、购物车、结账和 AI 聊天，均可真实使用" /></p>
            <span className="btn mt-4 inline-flex"><T th="ดูร้านตัวอย่าง →" en="View demo shop →" zh="查看示例店铺 →" /></span>
          </div>
        </Link>
        {X.map(([t, d], i) => <div key={i} className="card"><div className="h-28 rounded-lg bg-mist" /><h2 className="mt-4 font-bold"><T {...t} /></h2><p className="mt-1 text-sm text-ink/70"><T {...d} /></p></div>)}
      </div>
      <Link href="/register" className="btn mt-8"><T th="สร้างร้านของคุณ" en="Create your shop" zh="创建你的店铺" /></Link>
    </main>
  )
}
