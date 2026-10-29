# AI FutureX Tool (P1)
1. สร้างโปรเจกต์ที่ supabase.com แล้วรัน `supabase/migrations/001_init.sql` ใน SQL Editor
2. (ทดสอบเร็ว) Auth → Providers → Email → ปิด "Confirm email"
3. `cp .env.example .env.local` ใส่ URL + anon key แล้ว `npm i && npm run dev`
4. Deploy: push ขึ้น GitHub → Vercel → Import → ใส่ env 2 ตัวเดิม → Deploy
5. P2/P3: รัน `002_commerce.sql` และ `003_ai.sql` ตามลำดับ
6. P3: ตั้ง `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` (และ `OPENAI_MODEL` ถ้าต้องการ) ใน Vercel → Settings → Environment Variables ห้ามใส่ NEXT_PUBLIC_ นำหน้า
7. P4: รัน `004_integrations.sql` แล้ว Deploy ใหม่ (ไม่มี env เพิ่ม) · LINE: ตั้ง Webhook URL ตามหน้า /app/integrations
8. 005_p3_leftovers.sql แล้ว Deploy ใหม่ · ตั้ง NEXT_PUBLIC_SITE_URL เป็นโดเมนจริง (ใช้กับ sitemap)
9. P5: รัน 006_cross_tenant_hardening.sql แล้วทดสอบสิทธิ์ด้วย `npm run test:rls` (ใช้โปรเจกต์ Supabase ทดสอบ + .env.local ที่มี key ครบ 3 ตัว)
10. 007_cart_referrals.sql → ตะกร้าหลายสินค้า + ลิงก์แนะนำ /r/รหัส (ดูที่ /app/referrals)
11. 008_product_details.sql → เพิ่มรายละเอียด/รูปสินค้า และหน้าสินค้า /s/ร้าน/products/id
12. พื้นหลังอนิเมชันการตลาด (`components/MarketingBackground.tsx`) + สลับกลางวัน/กลางคืน + สลับภาษา ไทย/EN/中文 (`components/Prefs.tsx`, `lib/i18n.ts`) · เก็บค่าที่เลือกไว้ในคุกกี้ `ui_theme` / `ui_lang` · ข้อความใหม่ให้ใช้ `<T th="…" en="…" zh="…" />`
13. 009_storefront_checkout.sql → หน้าร้านแบบอีคอมเมิร์ซ: รูปสินค้าหลายรูป (อัปโหลดขึ้น Supabase Storage bucket `shop-media`), ราคาก่อนลด, สต็อก, หมวดหมู่, ตะกร้าสินค้า, หน้าชำระเงิน `/s/ร้าน/checkout`, หน้าติดตามออเดอร์ `/s/ร้าน/order/โทเคน` · ตั้งพร้อมเพย์/บัญชีธนาคาร/ค่าส่งที่ /app/settings · ต้องรัน `npm i` ใหม่ (เพิ่ม `qrcode`) · ลูกค้าแนบสลิปไป bucket `slips` แล้วเจ้าของร้านกดยืนยัน "ชำระแล้ว" ที่ /app/orders (ยังไม่ได้ต่อ payment gateway บัตรเครดิต)
14. 010_platform_admin.sql → แอดมินดูแลทั้งแพลตฟอร์มที่ /admin (ยอดรวม รายร้าน ระงับร้าน เปลี่ยนแพ็กเกจ) · ตั้งตัวเองเป็นแอดมินด้วย SQL ท้ายไฟล์ 010 (insert into platform_admins ...)
15. 011_starter_shop.sql → ร้านใหม่ทุกร้านเริ่มด้วยหน้าร้านพื้นฐาน (แบนเนอร์ `public/starter/banner.jpg`, สโลแกน, เกี่ยวกับร้าน) และสินค้าตัวอย่าง 7 รายการ (รหัส `SAMPLE-01…07` รูปอยู่ใน `public/starter/`) ทุกอย่างแก้/ลบได้ที่ /app/products และ /app/settings (ช่อง “เกี่ยวกับร้าน” ใหม่) · แต่ละบัญชีเห็น/แก้ได้เฉพาะร้านตัวเอง · ร้านเดิมที่ยังไม่มีสินค้ากดปุ่ม “โหลดสินค้าตัวอย่าง” ที่หน้าสินค้า หรือรันบรรทัด `select seed_starter_shop('UUID ร้าน', true)` ท้ายไฟล์ 011 เพื่อใส่หน้าร้านพื้นฐานให้ร้านเดิม
16. `npm run check:tenant` → ตรวจว่าโค้ดแดชบอร์ดกรอง tenant ครบ (ตาราง products / sales_pages / tenants เปิดอ่านสาธารณะเพื่อหน้าร้าน ถ้าลืมกรอง สมาชิกจะเห็นข้อมูลร้านอื่น) · ควรรันทุกครั้งก่อน deploy คู่กับ `npm run test:rls`
17. 012_futurex_samples.sql → เปลี่ยนสินค้าตัวอย่างเป็นสินค้า FutureX (YANEA, SANEA, PROM PORM Candy Detox, MATCHA/PSP/CELONYA, Happy Grain) จาก future-x.biz/th · ยังเป็น `SAMPLE-01…07` เหมือนเดิม · มีผลกับร้านที่สมัครใหม่ ร้านเดิมดูคำสั่งที่คอมเมนต์ท้ายไฟล์ · ราคา YANEA/SANEA เป็นราคาจากเว็บ ส่วนที่เหลือเป็นราคาตัวอย่าง
