import Link from 'next/link'
import { T } from '@/components/Prefs'
import type { Tx } from '@/lib/i18n'
const F: [Tx, Tx][] = [
  [
    { th: 'เซลเพจและสินค้า', en: 'Sales pages & products', zh: '销售页与商品' },
    { th: 'สมัครแล้วเพิ่มสินค้าจากพื้นที่ส่วนตัว ระบบสร้างหน้าร้านพร้อมหน้าสินค้าให้ทันที', en: 'Sign up, add products from your private workspace, and a storefront with product pages is generated instantly.', zh: '注册后在个人工作区添加商品，系统立即生成带商品页的店铺。' },
  ],
  [
    { th: 'AI ตอบแชท', en: 'AI chat replies', zh: 'AI 智能客服' },
    { th: 'ผู้ช่วย AI ตอบลูกค้าตามข้อมูลสินค้าของคุณ และส่งต่อให้เจ้าหน้าที่ได้', en: 'An AI assistant answers customers from your product data and can hand off to a human agent.', zh: 'AI 助手根据你的商品资料回复客户，并可转接真人客服。' },
  ],
  [
    { th: 'ติดตามลูกค้าและคำสั่งซื้อ', en: 'Track customers & orders', zh: '客户与订单追踪' },
    { th: 'รวมลูกค้า คำสั่งซื้อ และยอดขายไว้ในแดชบอร์ดเดียว', en: 'Customers, orders and sales together in one dashboard.', zh: '客户、订单和销售额集中在同一个仪表盘。' },
  ],
  [
    { th: 'NFC และลิงก์แนะนำ', en: 'NFC & referral links', zh: 'NFC 与推荐链接' },
    { th: 'นามบัตร NFC และลิงก์แนะนำเพื่อนที่นับผลงานให้อัตโนมัติ', en: 'NFC business cards and referral links that track results automatically.', zh: 'NFC 名片和推荐链接，自动统计业绩。' },
  ],
]
const STEPS: Tx[] = [
  { th: 'สมัครสมาชิกและตั้งชื่อร้าน', en: 'Sign up and name your shop', zh: '注册并为店铺命名' },
  { th: 'เข้าพื้นที่ส่วนตัว เพิ่มสินค้าพร้อมรายละเอียดและรูป', en: 'Enter your workspace and add products with details and photos', zh: '进入个人工作区，添加带详情和图片的商品' },
  { th: 'แชร์ลิงก์หน้าร้านให้ลูกค้าสั่งซื้อได้เลย', en: 'Share your storefront link so customers can order right away', zh: '分享店铺链接，客户即可下单' },
]
export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6">
      <section className="py-20">
        <p className="text-sm font-medium text-brand">AI FUTUREX TOOL</p>
        <h1 className="mt-3 text-4xl font-bold leading-tight md:text-5xl">
          <T th={'เปิดหน้าร้านออนไลน์ของคุณเอง\nภายในไม่กี่นาที'} en={'Open your own online store\nin minutes'} zh={'几分钟内\n开设你自己的网店'} />
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink/70">
          <T
            th="สมัครสมาชิก เพิ่มสินค้า แล้วแชร์ลิงก์ให้ลูกค้าได้ทันที ข้อมูลของแต่ละร้านแยกกันอย่างปลอดภัย"
            en="Sign up, add products, and share your link with customers right away. Each shop's data is kept securely separate."
            zh="注册账号、添加商品，即可立即把链接分享给客户。每家店铺的数据相互独立，安全可靠。" />
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/register" className="btn"><T th="สมัครสมาชิกฟรี" en="Sign up free" zh="免费注册" /></Link>
          <Link href="/templates" className="btn-ghost"><T th="ดูตัวอย่างเซลเพจ" en="See sales page examples" zh="查看页面示例" /></Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {F.map(([t, d], i) => <div key={i} className="card"><h2 className="font-bold"><T {...t} /></h2><p className="mt-2 text-sm text-ink/70"><T {...d} /></p></div>)}
      </section>
      <section className="mt-16 panel rounded-xl p-8">
        <h2 className="text-xl font-bold"><T th="เริ่มใน 3 ขั้นตอน" en="Get started in 3 steps" zh="三步开始" /></h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-white/80">
          {STEPS.map((s, i) => <li key={i}><T {...s} /></li>)}
        </ol>
      </section>
    </main>
  )
}
