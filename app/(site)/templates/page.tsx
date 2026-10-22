import Link from 'next/link'
import { T } from '@/components/Prefs'
import type { Tx } from '@/lib/i18n'
export const metadata = { title: 'ตัวอย่างเซลเพจ · AI FutureX Tool' }
const X: [Tx, Tx][] = [
  [{ th: 'ร้านสินค้าเพื่อสุขภาพ', en: 'Health products shop', zh: '健康产品店' }, { th: 'หน้าแนะนำสินค้า + ตะกร้า', en: 'Product pages + cart', zh: '商品介绍页 + 购物车' }],
  [{ th: 'ร้านเสื้อผ้าออนไลน์', en: 'Online clothing store', zh: '网上服装店' }, { th: 'แกลเลอรีสินค้าและแชท AI', en: 'Product gallery and AI chat', zh: '商品展示和 AI 聊天' }],
  [{ th: 'ตัวแทนขายตรง', en: 'Direct-sales agent', zh: '直销代理' }, { th: 'ลิงก์แนะนำและนามบัตร NFC', en: 'Referral links and NFC card', zh: '推荐链接和 NFC 名片' }],
]
export default function Templates() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold"><T th="ตัวอย่างเซลเพจ" en="Sales page examples" zh="销售页示例" /></h1>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {X.map(([t, d], i) => <div key={i} className="card"><div className="h-28 rounded-lg bg-mist" /><h2 className="mt-4 font-bold"><T {...t} /></h2><p className="mt-1 text-sm text-ink/70"><T {...d} /></p></div>)}
      </div>
      <Link href="/register" className="btn mt-8"><T th="สร้างร้านของคุณ" en="Create your shop" zh="创建你的店铺" /></Link>
    </main>
  )
}
