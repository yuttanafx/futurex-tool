import { getContext } from '@/lib/tenant'
import { T } from '@/components/Prefs'
import TemplateManager, { type Template } from './TemplateManager'
export const dynamic = 'force-dynamic'
const TIKTOK_APP = process.env.NEXT_PUBLIC_TIKTOK_APP_URL || 'https://tiktok-app-7jro.vercel.app'

export default async function Tiktok() {
  const { sb, tenant } = await getContext()
  const { data } = await sb.from('tiktok_templates')
    .select('id,name,price,caption,tags,details,fda_no,source_url,tiktok_url')
    .eq('tenant_id', tenant.id).order('updated_at', { ascending: false })
  const items = (data ?? []) as Template[]
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold"><T th="ปักตะกร้า TikTok" en="TikTok basket templates" zh="TikTok 购物车模板" /></h1>
        <a href={TIKTOK_APP} target="_blank" rel="noopener noreferrer" className="btn">
          <T th="ไปเว็บ TikTok App ↗" en="Go to TikTok App ↗" zh="前往 TikTok App ↗" />
        </a>
      </div>
      <p className="mt-1 text-sm text-ink/60">
        <T
          th="เก็บชื่อ ราคา แคปชัน แฮชแท็ก และลิงก์ตะกร้า TikTok ของสินค้าแต่ละตัว กดคัดลอกครั้งเดียวแล้วไปวางตอนโพสต์คลิป ระบบไม่ได้ปักตะกร้าแทน ต้องกดเพิ่มสินค้าในแอป TikTok เอง"
          en="Keep each product's name, price, caption, hashtags and TikTok basket link. Copy in one tap and paste when posting. This page doesn't pin the basket for you; add the product in the TikTok app yourself."
          zh="保存每个商品的名称、价格、文案、话题标签和 TikTok 购物车链接，一键复制后发布视频时粘贴。本页不会代为挂车，需在 TikTok 应用中自行添加商品。"
        />
      </p>
      <TemplateManager items={items} />
    </>
  )
}
