import type { Tx } from '@/lib/i18n'

/**
 * ====== ใส่ลิงก์วิดีโอแนะนำการใช้งานตรงนี้ ======
 * รองรับ: YouTube (watch / youtu.be / shorts), Vimeo, Google Drive (…/file/d/ID/view), ไฟล์ .mp4 / .webm
 * หรือตั้งเป็น env `NEXT_PUBLIC_TUTORIAL_VIDEO_URL` ใน Vercel ก็ได้ (ไม่ต้องแก้โค้ด)
 * ปล่อยว่างไว้ = แสดงกรอบ "วิดีโอกำลังจะมาเร็วๆ นี้"
 */
export const TUTORIAL_VIDEO_URL: string = process.env.NEXT_PUBLIC_TUTORIAL_VIDEO_URL || ''

export type GuideItem = {
  href: string
  icon: string
  title: Tx
  benefit: Tx // มีประโยชน์ยังไง
  steps: Tx[] // ใช้งานยังไง
  videoUrl?: string // (ไม่บังคับ) วิดีโอสั้นของฟีเจอร์นี้โดยเฉพาะ ใส่ลิงก์เหมือนด้านบน
}

const t = (th: string, en: string, zh: string): Tx => ({ th, en, zh })

export const GUIDE: GuideItem[] = [
  {
    href: '/app/dashboard', icon: '📊', title: t('แดชบอร์ด', 'Dashboard', '仪表盘'),
    benefit: t('เห็นยอดขายวันนี้ คำสั่งซื้อ และลูกค้าใหม่ 7 วันในหน้าเดียว ตัดสินใจได้เร็วโดยไม่ต้องเปิดหลายหน้า', "See today's sales, orders and 7-day new customers on one screen so you can decide fast.", '一屏查看今日销售额、订单和近 7 天新客户，快速决策。'),
    steps: [
      t('เข้าสู่ระบบแล้วจะมาที่หน้านี้เป็นหน้าแรก', 'After login you land here first.', '登录后首先进入此页。'),
      t('ดูตัวเลขสรุปด้านบนและกราฟยอดขาย 7 วัน', 'Check the summary numbers and the 7-day sales chart.', '查看顶部汇总数字和 7 天销售图表。'),
      t('คัดลอกลิงก์หน้าร้านไปแชร์ให้ลูกค้า', 'Copy your storefront link and share it with customers.', '复制店铺链接分享给客户。'),
    ],
  },
  {
    href: '/app/products', icon: '🛍️', title: t('สินค้า', 'Products', '商品'),
    benefit: t('จัดการสินค้าทั้งหมดของร้าน ใส่รูป ราคา ราคาก่อนลด สต็อก และหมวดหมู่ แล้วขึ้นหน้าร้านให้ทันที', 'Manage every product: photos, price, original price, stock and category, published to your storefront instantly.', '管理全部商品：图片、价格、原价、库存和分类，即时上架到店铺。'),
    steps: [
      t('กดเพิ่มสินค้า ใส่ชื่อ ราคา และรายละเอียด', 'Add a product with name, price and details.', '点击添加商品，填写名称、价格和详情。'),
      t('อัปโหลดรูปสินค้าได้หลายรูป', 'Upload one or more product photos.', '上传一张或多张商品图片。'),
      t('บันทึก แล้วเปิดหน้าร้านดูผลได้เลย', 'Save, then open your shop to see it live.', '保存后打开店铺即可查看效果。'),
    ],
  },
  {
    href: '/app/pages', icon: '📄', title: t('เซลเพจ', 'Sales pages', '销售页'),
    benefit: t('สร้างหน้าขายสินค้าสำหรับยิงแอดหรือแชร์ลิงก์ และเชื่อมเพจ Facebook เพื่อโพสต์ได้จากที่เดียว', 'Build landing pages for ads or sharing, and connect your Facebook Page to post from one place.', '创建用于投放广告或分享的销售页，并连接 Facebook 主页，一处发布。'),
    steps: [
      t('สร้างเซลเพจใหม่และเลือกสินค้า', 'Create a new sales page and pick products.', '新建销售页并选择商品。'),
      t('(ถ้าต้องการ) กดเชื่อมเพจ Facebook', '(Optional) Connect your Facebook Page.', '（可选）连接 Facebook 主页。'),
      t('คัดลอกลิงก์หรือโพสต์ลงเพจ', 'Copy the link or post to your Page.', '复制链接或发布到主页。'),
    ],
  },
  {
    href: '/app/orders', icon: '🧾', title: t('คำสั่งซื้อ', 'Orders', '订单'),
    benefit: t('รวมออเดอร์จากหน้าร้านไว้ที่เดียว ตรวจสลิปโอนเงิน และกดยืนยันว่าชำระแล้ว ลดความผิดพลาดและงานตามเงิน', 'All storefront orders in one place. Check payment slips and confirm payment with one click.', '集中查看店铺订单，核对转账凭证并一键确认收款。'),
    steps: [
      t('เปิดรายการคำสั่งซื้อใหม่', 'Open the new orders list.', '打开新订单列表。'),
      t('ตรวจสลิปที่ลูกค้าแนบ', 'Review the slip the customer attached.', '核对客户上传的凭证。'),
      t('กดยืนยัน "ชำระแล้ว" แล้วจัดส่ง', 'Mark it "paid", then ship.', '点击“已付款”并发货。'),
    ],
  },
  {
    href: '/app/customers', icon: '👥', title: t('ลูกค้า', 'Customers', '客户'),
    benefit: t('เก็บรายชื่อและประวัติลูกค้าไว้อัตโนมัติ เอาไว้ติดตามและขายซ้ำได้', 'Customer records are saved automatically so you can follow up and resell.', '自动保存客户资料和记录，方便跟进与复购。'),
    steps: [
      t('เปิดหน้าลูกค้า', 'Open the Customers page.', '打开客户页面。'),
      t('ดูรายชื่อและข้อมูลติดต่อ', 'Browse names and contact info.', '查看名单和联系方式。'),
      t('ใช้ข้อมูลนี้ติดตามหรือเสนอโปรโมชัน', 'Use it to follow up or offer promotions.', '用于跟进或推送促销。'),
    ],
  },
  {
    href: '/app/inbox', icon: '💬', title: t('กล่องข้อความ', 'Inbox', '收件箱'),
    benefit: t('รวมข้อความลูกค้าจาก LINE, Facebook Messenger และหน้าร้านมาไว้ที่เดียว ตอบเองหรือรับช่วงต่อจาก AI ได้', 'Customer messages from LINE, Messenger and your shop in one inbox. Reply yourself or take over from the AI.', '汇总 LINE、Messenger 和店铺的客户消息，可自己回复或接手 AI 对话。'),
    steps: [
      t('เชื่อมช่องทางที่เมนู "ช่องทาง" ก่อน', 'Connect channels first under "Channels".', '先在“渠道”中连接账号。'),
      t('เปิดบทสนทนาที่ลูกค้าทักเข้ามา', 'Open a conversation from a customer.', '打开客户发来的对话。'),
      t('พิมพ์ตอบกลับได้ทันที', 'Type your reply right away.', '直接输入回复。'),
    ],
  },
  {
    href: '/app/ai', icon: '🤖', title: t('ผู้ช่วย AI', 'AI assistant', 'AI 助手'),
    benefit: t('AI ตอบแชทลูกค้าตามข้อมูลสินค้าของคุณ 24 ชั่วโมง ประหยัดเวลาและไม่พลาดลูกค้า', 'An AI answers customers from your product data around the clock, saving time and missed sales.', 'AI 根据你的商品资料全天候回复客户，省时且不错过订单。'),
    steps: [
      t('ใส่ API key ของ AI ที่เมนู "ตั้งค่า API ของ AI"', 'Add an AI API key under "AI API keys".', '在“AI API 密钥”中添加密钥。'),
      t('เปิดใช้ผู้ช่วยบนหน้าร้าน และเขียนคำแนะนำน้ำเสียง/จุดขาย', 'Enable the shop assistant and write tone/selling-point instructions.', '启用店铺助手并填写语气与卖点说明。'),
      t('ดูข้อความล่าสุดที่ลูกค้าถามได้ในหน้านี้', 'See the latest customer questions on this page.', '在此页查看客户最新提问。'),
    ],
  },
  {
    href: '/app/ai-keys', icon: '🗝️', title: t('ตั้งค่า API ของ AI', 'AI API keys', 'AI API 密钥'),
    benefit: t('ใช้ key ของ Claude / GPT / Gemini ของคุณเอง ข้อมูลแยกตามร้านและเข้ารหัสไว้', 'Use your own Claude / GPT / Gemini key. Stored encrypted and separated per shop.', '使用你自己的 Claude / GPT / Gemini 密钥，按店铺隔离并加密存储。'),
    steps: [
      t('สร้าง key จากเว็บผู้ให้บริการ AI', "Create a key on your AI provider's site.", '在 AI 服务商网站创建密钥。'),
      t('วางลงในช่อง API key', 'Paste it into the API key field.', '粘贴到密钥输入框。'),
      t('กด "บันทึกและใช้ตัวนี้"', 'Press "Save and use this".', '点击“保存并使用”。'),
    ],
  },
  {
    href: '/app/live', icon: '🎥', title: t('ไลฟ์', 'Live', '直播'),
    benefit: t('ผู้ช่วยไลฟ์สดช่วยแนะนำคำพูดและตอบคอมเมนต์ระหว่างไลฟ์ ให้ขายได้ลื่นขึ้น', 'The live-stream assistant suggests what to say and how to answer comments while you sell live.', '直播助手在直播中提示话术并协助回复评论，让成交更顺畅。'),
    steps: [
      t('ตั้งค่า API ของ AI ก่อน', 'Set up your AI API key first.', '先设置 AI 密钥。'),
      t('เปิดหน้าไลฟ์ก่อนเริ่มถ่ายทอดสด', 'Open this page before going live.', '开播前打开此页。'),
      t('ดูคำแนะนำที่ขึ้นมาแล้วนำไปพูดได้เลย', 'Read the suggestions and use them on air.', '参考弹出的建议直接口播。'),
    ],
  },
  {
    href: '/app/content', icon: '✍️', title: t('คอนเทนต์', 'Content', '内容'),
    benefit: t('ให้ AI ช่วยเขียนโพสต์ แคปชัน และข้อความขายสินค้า เก็บไว้ในคลัง แล้วโพสต์ลงเพจได้', 'Have AI write posts, captions and sales copy, keep them in a library and post to your Page.', '让 AI 撰写帖子、文案和销售话术，存入内容库并可发布到主页。'),
    steps: [
      t('เลือกสินค้าและสไตล์ที่ต้องการ', 'Pick a product and style.', '选择商品和风格。'),
      t('กดสร้างคอนเทนต์', 'Generate the content.', '点击生成内容。'),
      t('แก้ไข เก็บในคลัง หรือกด "โพสต์ลงเพจ"', 'Edit, save to the library, or press "Post to Page".', '编辑、保存到内容库，或点击“发布到主页”。'),
    ],
  },
  {
    href: '/app/adcontent', icon: '🎯', title: t('ยิงแอด คอนเทนต์', 'Ad Content', '广告内容'),
    benefit: t('เครื่องมือช่วยทำคอนเทนต์สำหรับยิงโฆษณา เปิดใช้งานได้ในหน้าเดียวกับระบบ', 'A tool to produce ad content, available right inside your workspace.', '制作广告内容的工具，可直接在工作区内使用。'),
    steps: [
      t('เปิดหน้านี้', 'Open this page.', '打开此页面。'),
      t('ทำตามขั้นตอนในเครื่องมือ', 'Follow the steps in the tool.', '按工具内步骤操作。'),
      t('ถ้าหน้าไม่แสดง กด "เปิดในแท็บใหม่"', `If it doesn't load, press "Open in new tab".`, '若未显示，点击“在新标签页打开”。'),
    ],
  },
  {
    href: '/app/tiktok', icon: '🎵', title: t('ปักตะกร้า TikTok', 'TikTok Basket', 'TikTok 购物车'),
    benefit: t('จัดการเทมเพลตสำหรับปักตะกร้าสินค้าบน TikTok ช่วยให้ทำซ้ำได้เร็วขึ้น', 'Manage templates for TikTok shopping baskets so repeat tasks go faster.', '管理 TikTok 购物车模板，重复操作更高效。'),
    steps: [
      t('เปิดหน้า TikTok', 'Open the TikTok page.', '打开 TikTok 页面。'),
      t('สร้างหรือเลือกเทมเพลต', 'Create or choose a template.', '创建或选择模板。'),
      t('ไปเว็บ TikTok App เพื่อใช้งานต่อ', 'Continue on the TikTok App site.', '前往 TikTok App 网站继续操作。'),
    ],
  },
  {
    href: '/app/mbo', icon: '🔑', title: t('ล็อกอินสมาชิก FutureX', 'FutureX Member Login', 'FutureX 会员登录'),
    benefit: t('เข้าระบบสมาชิก FutureX ได้จากในแดชบอร์ดนี้ ไม่ต้องสลับไปมาหลายเว็บ', 'Reach the FutureX member system from inside this dashboard, no tab juggling.', '在本后台内直接进入 FutureX 会员系统，无需来回切换网站。'),
    steps: [
      t('เปิดหน้านี้', 'Open this page.', '打开此页面。'),
      t('ล็อกอินด้วยบัญชีสมาชิก FutureX', 'Log in with your FutureX member account.', '使用 FutureX 会员账号登录。'),
      t('ถ้าไม่แสดง กด "เปิดในแท็บใหม่"', `If it doesn't load, press "Open in new tab".`, '若未显示，点击“在新标签页打开”。'),
    ],
  },
  {
    href: '/app/nfc', icon: '📡', title: t('NFC', 'NFC', 'NFC'),
    benefit: t('ทำนามบัตร NFC แตะแล้วเปิดหน้าร้านหรือลิงก์ของคุณทันที เหมาะกับงานอีเวนต์และพบลูกค้า', 'NFC business cards: one tap opens your shop or link. Great for events and meetings.', 'NFC 名片，轻轻一碰即可打开你的店铺或链接，适合活动和见客户。'),
    steps: [
      t('เปิดหน้า NFC และเลือกลิงก์ที่ต้องการ', 'Open NFC and choose the link.', '打开 NFC 页面并选择链接。'),
      t('คัดลอกลิงก์หรือ QR', 'Copy the link or QR.', '复制链接或二维码。'),
      t('เขียนลงการ์ด NFC แล้วแตะทดสอบ', 'Write it to an NFC card and tap to test.', '写入 NFC 卡片并轻触测试。'),
    ],
  },
  {
    href: '/app/referrals', icon: '🔗', title: t('ลิงก์แนะนำ', 'Referrals', '推荐链接'),
    benefit: t('แชร์ลิงก์แนะนำของคุณ ระบบนับผลงานให้อัตโนมัติ ทั้งตัวแทนที่สมัครและคำสั่งซื้อ', 'Share your referral link and results are counted automatically: signups and orders.', '分享你的推荐链接，系统自动统计注册代理和订单业绩。'),
    steps: [
      t('คัดลอกลิงก์แนะนำของคุณ', 'Copy your referral link.', '复制你的推荐链接。'),
      t('ส่งให้เพื่อนหรือแชร์ลงโซเชียล', 'Send it to friends or share on social.', '发给朋友或分享到社交平台。'),
      t('กลับมาดูตัวแทนและออเดอร์ล่าสุดที่หน้านี้', 'Return here to see recent signups and orders.', '回到此页查看最新代理与订单。'),
    ],
  },
  {
    href: '/app/billing', icon: '💳', title: t('ค่าบริการ & วอลเล็ต', 'Billing & Wallet', '费用与钱包'),
    benefit: t('เลือกแพ็กเกจ ต่ออายุ เติมวอลเล็ต และดูใบแจ้งหนี้ได้เอง จ่ายด้วยบาท วอลเล็ต หรือ PV ตามที่เปิดให้ใช้', 'Pick a plan, renew, top up your wallet and view invoices. Pay by baht, wallet or PV where enabled.', '自助选择套餐、续费、充值钱包并查看账单，可按开放方式用泰铢、钱包或 PV 支付。'),
    steps: [
      t('เลือกแพ็กเกจและจำนวนเดือน', 'Choose a plan and number of months.', '选择套餐和月数。'),
      t('เลือกวิธีชำระเงิน', 'Choose a payment method.', '选择支付方式。'),
      t('ถ้าจ่ายด้วยบาท ให้โอนตาม QR แล้วแนบสลิป รอแอดมินอนุมัติ', 'If paying in baht, transfer via QR, attach the slip and wait for approval.', '若用泰铢支付，扫码转账并上传凭证，等待管理员审核。'),
    ],
  },
  {
    href: '/app/integrations', icon: '🔌', title: t('ช่องทาง', 'Channels', '渠道'),
    benefit: t('เชื่อมต่อ LINE Official Account เพื่อให้ข้อความเข้ากล่องข้อความและให้ AI ช่วยตอบ', 'Connect your LINE Official Account so messages reach the Inbox and AI can help reply.', '连接 LINE 官方账号，让消息进入收件箱并由 AI 协助回复。'),
    steps: [
      t('คัดลอก Webhook URL ในหน้านี้', 'Copy the Webhook URL on this page.', '复制此页的 Webhook 地址。'),
      t('นำไปวางในการตั้งค่า LINE Developers', 'Paste it into LINE Developers settings.', '粘贴到 LINE Developers 设置中。'),
      t('ใส่ค่าที่ขอแล้วบันทึก', 'Fill in the requested values and save.', '填写所需信息并保存。'),
    ],
  },
  {
    href: '/app/settings', icon: '⚙️', title: t('ตั้งค่า', 'Settings', '设置'),
    benefit: t('ตั้งค่าหน้าร้าน ค่าจัดส่ง และช่องทางรับชำระเงิน (พร้อมเพย์/บัญชีธนาคาร) ให้ลูกค้าสั่งซื้อได้ครบ', 'Set up your storefront, shipping fees and payment details (PromptPay / bank) so customers can check out.', '设置店铺、运费和收款方式（PromptPay/银行账户），让客户顺利下单。'),
    steps: [
      t('กรอกข้อมูลหน้าร้านและเกี่ยวกับร้าน', 'Fill in storefront and About info.', '填写店铺和“关于我们”信息。'),
      t('ตั้งค่าจัดส่งและพร้อมเพย์/บัญชีธนาคาร', 'Set shipping and PromptPay / bank account.', '设置运费和 PromptPay/银行账户。'),
      t('กดบันทึก', 'Save.', '点击保存。'),
    ],
  },
]

/**
 * กลุ่มปุ่มที่โชว์บนหน้าเว็บ (16 ปุ่ม) เรียงเหมือนเมนูด้านข้างของระบบ
 * อยากเพิ่ม/ลดปุ่ม: เพิ่มหรือลบ href ในลิสต์นี้ (ข้อมูลของ /app/dashboard และ /app/ai-keys ยังอยู่ใน GUIDE ไม่ได้ถูกลบ)
 */
export const GROUPS: { title: Tx; hrefs: string[] }[] = [
  { title: t('ขาย', 'Sales', '销售'), hrefs: ['/app/products', '/app/pages', '/app/orders', '/app/customers'] },
  { title: t('AI และสื่อสาร', 'AI & Communication', 'AI 与沟通'), hrefs: ['/app/inbox', '/app/ai', '/app/live', '/app/content', '/app/adcontent', '/app/tiktok', '/app/mbo'] },
  { title: t('เครื่องมือ', 'Tools', '工具'), hrefs: ['/app/nfc', '/app/referrals', '/app/billing', '/app/integrations', '/app/settings'] },
]

/** ประโยชน์สั้นๆ 1 บรรทัด แสดงบนตัวปุ่ม */
export const TAGLINES: Record<string, Tx> = {
  '/app/products': t('จัดการสินค้า รูป ราคา สต็อก', 'Products, photos, price, stock', '管理商品、图片与库存'),
  '/app/pages': t('สร้างหน้าขาย + โพสต์ Facebook', 'Sales pages + Facebook posts', '销售页与 Facebook 发布'),
  '/app/orders': t('รวมออเดอร์ ตรวจสลิป ยืนยันชำระ', 'Orders, slips, payment check', '订单、凭证、确认收款'),
  '/app/customers': t('เก็บรายชื่อลูกค้าอัตโนมัติ', 'Customer list kept for you', '自动保存客户名单'),
  '/app/inbox': t('รวมแชท LINE / Messenger / หน้าร้าน', 'LINE, Messenger, shop chats', '汇总 LINE、Messenger 聊天'),
  '/app/ai': t('AI ตอบแชทแทนคุณ 24 ชม.', 'AI answers chats 24/7', 'AI 全天候回复客户'),
  '/app/live': t('ผู้ช่วยคิดคำพูดตอนไลฟ์', 'Live-selling assistant', '直播话术助手'),
  '/app/content': t('AI เขียนโพสต์และแคปชัน', 'AI writes posts and captions', 'AI 撰写帖子和文案'),
  '/app/adcontent': t('ทำคอนเทนต์สำหรับยิงแอด', 'Ad content maker', '制作广告内容'),
  '/app/tiktok': t('จัดการเทมเพลตตะกร้า TikTok', 'TikTok basket templates', 'TikTok 购物车模板'),
  '/app/mbo': t('เข้าระบบสมาชิก FutureX', 'FutureX member login', '进入 FutureX 会员系统'),
  '/app/nfc': t('นามบัตร NFC แตะแล้วเปิดร้าน', 'Tap an NFC card, open your shop', 'NFC 名片一碰开店'),
  '/app/referrals': t('ลิงก์แนะนำ นับผลงานอัตโนมัติ', 'Referral links, auto tracking', '推荐链接自动统计'),
  '/app/billing': t('แพ็กเกจ วอลเล็ต ใบแจ้งหนี้', 'Plans, wallet, invoices', '套餐、钱包、账单'),
  '/app/integrations': t('เชื่อม LINE Official Account', 'Connect LINE Official Account', '连接 LINE 官方账号'),
  '/app/settings': t('ตั้งค่าร้าน จัดส่ง รับเงิน', 'Shop, shipping, payments', '店铺、运费、收款设置'),
}
