import { T } from '@/components/Prefs'
import type { Tx } from '@/lib/i18n'
export const metadata = { title: 'ฟังก์ชัน · AI FutureX Tool' }
const F: [Tx, Tx][] = [
  [{ th: 'Sales Page Builder', en: 'Sales Page Builder', zh: '销售页生成器' },
   { th: 'สร้างเซลเพจและจัดการสินค้า พร้อมหน้าสินค้าแต่ละชิ้นที่ลูกค้าเปิดดูได้', en: 'Build sales pages and manage products, with a dedicated page for every item customers can open.', zh: '创建销售页并管理商品，每件商品都有可供客户查看的独立页面。' }],
  [{ th: 'AI Sales Engine', en: 'AI Sales Engine', zh: 'AI 销售引擎' },
   { th: 'ตอบแชทลูกค้า ส่งต่อเจ้าหน้าที่ และดูประวัติบทสนทนาในกล่องข้อความ', en: 'Reply to customer chats, hand off to staff, and review conversation history in the inbox.', zh: '自动回复客户聊天，转接人工，并在收件箱查看对话记录。' }],
  [{ th: 'SEO & Content', en: 'SEO & Content', zh: 'SEO 与内容' },
   { th: 'ตั้งหัวข้อและคำอธิบายสำหรับ Google และเก็บคลังคอนเทนต์ไว้ใช้ซ้ำ', en: 'Set titles and descriptions for Google, and keep a content library to reuse.', zh: '为 Google 设置标题和描述，并建立可复用的内容库。' }],
  [{ th: 'AI Live Assistant', en: 'AI Live Assistant', zh: 'AI 直播助手' },
   { th: 'ผู้ช่วยระหว่างไลฟ์สด แนะนำคำตอบจากคอมเมนต์', en: 'An assistant during live streams that suggests replies from comments.', zh: '直播期间的助手，根据评论推荐回复。' }],
  [{ th: 'CRM และคำสั่งซื้อ', en: 'CRM & Orders', zh: 'CRM 与订单' },
   { th: 'เก็บข้อมูลลูกค้าและติดตามสถานะคำสั่งซื้อ', en: 'Store customer data and track order status.', zh: '保存客户资料并跟踪订单状态。' }],
  [{ th: 'NFC และ Referral', en: 'NFC & Referral', zh: 'NFC 与推荐' },
   { th: 'นามบัตร NFC และลิงก์แนะนำที่นับยอดขายและสมาชิกใหม่', en: 'NFC business cards and referral links that count sales and new members.', zh: 'NFC 名片和推荐链接，统计销售额与新会员。' }],
]
export default function Features() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-bold"><T th="ฟังก์ชันทั้งหมด" en="All features" zh="全部功能" /></h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {F.map(([t, d], i) => <div key={i} className="card"><h2 className="font-bold"><T {...t} /></h2><p className="mt-2 text-sm text-ink/70"><T {...d} /></p></div>)}
      </div>
    </main>
  )
}
