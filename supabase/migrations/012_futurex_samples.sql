-- สินค้าตัวอย่างชุดใหม่ = สินค้า FutureX (ข้อมูลจาก https://www.future-x.biz/th) แทนผักผลไม้ (รันต่อจาก 011)
-- ยังคงรหัส SAMPLE-01…07 และจำนวน 7 รายการเหมือนเดิม → หน้า /app/products และ npm run test:rls ใช้ได้ตามเดิม
-- รูปสินค้าเป็นลิงก์ภายนอกจากเว็บ FutureX (static.wixstatic.com) เจ้าของร้านเปลี่ยนเป็นรูปของตัวเองได้ที่ /app/products
-- หมายเหตุ: ราคา YANEA / SANEA เป็นราคาที่ระบุบนเว็บ ส่วนสินค้าอื่นเว็บไม่ได้ระบุราคา → ใส่ราคาตัวอย่าง (แก้ได้)

create or replace function seed_starter_shop(p_tenant uuid, p_site boolean) returns int language plpgsql security definer set search_path = public as $$
declare n int := 0;
begin
  if p_site then  -- ตั้งค่าหน้าร้านเฉพาะค่าที่ยังว่าง ไม่ทับของเดิม
    update tenants set
      tagline = coalesce(tagline, 'อาหารเสริมเพื่อสุขภาพและความงาม จาก FutureX'),
      about = coalesce(about, 'ยินดีต้อนรับสู่ร้านของเรา เรารวมอาหารเสริมคุณภาพ เช่น YANEA (NMN + คอลลาเจน) SANEA เพื่อสมดุลของผู้หญิง PROM PORM Candy Detox และโปรตีนธัญพืชรวมกว่า 43 ชนิด เลือกสินค้าใส่ตะกร้า กรอกที่อยู่ แล้วชำระเงินได้ทันที หากมีคำถามสอบถามผู้ช่วยของร้านได้ตลอดเวลา'),
      banner_url = coalesce(banner_url, '/starter/banner.jpg')
    where id = p_tenant;
  end if;
  if exists (select 1 from products where tenant_id = p_tenant) then return 0; end if;  -- มีสินค้าอยู่แล้วไม่เพิ่มซ้ำ
  insert into products (tenant_id, sku, name, price, compare_price, category, description, image_url, images) values
    (p_tenant, 'SAMPLE-01', 'YANEA ยาเนีย NMN + คอลลาเจน (กล่องใหญ่ 30 ซอง)', 2300, null, 'ผิวพรรณและต่อต้านวัย',
      E'ซีรีส์เรือธง สูตร Uthever® NMN ผสม Collagen Optima® ดูแลผิวและการฟื้นบำรุงเซลล์จากภายใน\n\nส่วนประกอบสำคัญ: Uthever® NMN, Collagen Optima®, แบล็กเคอร์แรนต์ (IPRONA), เห็ดหิมะ, สารสกัดเมล็ดองุ่น, อะเซโรลาเชอร์รี่, สารสกัดเปลือกสน, แอสตาแซนธิน\n\nจุดเด่น: กระตุ้นการสร้างเซลล์ผิวใหม่ เพิ่มความยืดหยุ่นและความชุ่มชื้นลึก ลดเลือนริ้วรอย สนับสนุนคอลลาเจนตามธรรมชาติและพลังงานของเซลล์\n\nวิธีรับประทาน: ฉีกซองทานได้เลย หรือผสม 1 ซอง (3 กรัม) กับน้ำ 100 มล. วันละ 1–2 ซอง',
      'https://static.wixstatic.com/media/11e8bf_3aefa9fb34e64b33a15ff10c76265d57~mv2.png',
      array['https://static.wixstatic.com/media/11e8bf_3aefa9fb34e64b33a15ff10c76265d57~mv2.png','https://static.wixstatic.com/media/11e8bf_7814a263d1eb47608fcb76ea7ec94f31~mv2.png','https://static.wixstatic.com/media/11062b_de46667dfdba445994e2b216a91629aff000.jpg','https://static.wixstatic.com/media/11e8bf_1733bf966dcc4846ae3121520c19e8d0~mv2.png']),
    (p_tenant, 'SAMPLE-02', 'YANEA ยาเนีย NMN + คอลลาเจน (กล่องพกพา 10 ซอง)', 890, null, 'ผิวพรรณและต่อต้านวัย',
      E'ขนาดทดลอง/พกพา สูตรเดียวกับกล่องใหญ่ Uthever® NMN + Collagen Optima® ช่วยบำรุงผิวให้เนียนนุ่ม ชุ่มชื้น\n\nวิธีรับประทาน: ฉีกซองทานได้เลย หรือผสม 1 ซอง (3 กรัม) กับน้ำ 100 มล. วันละ 1–2 ซอง',
      'https://static.wixstatic.com/media/11e8bf_7814a263d1eb47608fcb76ea7ec94f31~mv2.png',
      array['https://static.wixstatic.com/media/11e8bf_7814a263d1eb47608fcb76ea7ec94f31~mv2.png','https://static.wixstatic.com/media/11e8bf_3aefa9fb34e64b33a15ff10c76265d57~mv2.png']),
    (p_tenant, 'SAMPLE-03', 'SANEA ซาเนีย สมดุลผู้หญิง (กล่องใหญ่ 30 ซอง)', 2300, null, 'สุขภาพผู้หญิง',
      E'สูตรช่วยปรับสมดุลฮอร์โมนหญิงอย่างเป็นธรรมชาติ ผสานสมุนไพรดั้งเดิมกับวิทยาศาสตร์สมัยใหม่\n\nส่วนประกอบสำคัญ: Estrogy-100®, คาซิป ฟาติมาห์, มัญจากานี, กวาวเครือขาว, บีทรูท, ไลโคปีน\n\nจุดเด่น: สนับสนุนสมดุลฮอร์โมน บรรเทาอาการปวดประจำเดือนและ PMS ผิวเรียบเนียนกระชับ ช่วยปรับอารมณ์ ลดความเครียด และดูแลสุขภาพจุดซ่อนเร้น\n\nวิธีรับประทาน: ฉีกซองทานได้เลย หรือผสม 1 ซอง (3 กรัม) กับน้ำ 100 มล. วันละ 1–2 ซอง',
      'https://static.wixstatic.com/media/11e8bf_0ada9828ccbf480584fa7c4635ba6fd1~mv2.png',
      array['https://static.wixstatic.com/media/11e8bf_0ada9828ccbf480584fa7c4635ba6fd1~mv2.png','https://static.wixstatic.com/media/11e8bf_cde5341729a64968b5982bf5fde4ed63~mv2.png','https://static.wixstatic.com/media/11e8bf_74ae3523b4794976874c0617bbe01ebb~mv2.jpg','https://static.wixstatic.com/media/11e8bf_2a76dff7f0c74079aa0b106b56ad89bd~mv2.png','https://static.wixstatic.com/media/11e8bf_9614604d0f3e4a7b86922f15700494e8~mv2.jpg','https://static.wixstatic.com/media/11e8bf_5367e134c03b40f884506b82fd9f205c~mv2.png']),
    (p_tenant, 'SAMPLE-04', 'SANEA ซาเนีย สมดุลผู้หญิง (กล่องพกพา 10 ซอง)', 890, null, 'สุขภาพผู้หญิง',
      E'ขนาดทดลอง/พกพา สูตรเดียวกับกล่องใหญ่ เพื่อสมดุลของผู้หญิง ทานง่าย พกสะดวก\n\nวิธีรับประทาน: ฉีกซองทานได้เลย หรือผสม 1 ซอง (3 กรัม) กับน้ำ 100 มล. วันละ 1–2 ซอง',
      'https://static.wixstatic.com/media/11e8bf_cde5341729a64968b5982bf5fde4ed63~mv2.png',
      array['https://static.wixstatic.com/media/11e8bf_cde5341729a64968b5982bf5fde4ed63~mv2.png','https://static.wixstatic.com/media/11e8bf_0ada9828ccbf480584fa7c4635ba6fd1~mv2.png']),
    (p_tenant, 'SAMPLE-05', 'PROM PORM Candy Detox พรอม พอร์ม แคนดี้ ดีท็อกซ์', 590, 690, 'ขับถ่ายและดีท็อกซ์',
      E'อาหารเสริมรูปแบบลูกอม ไฟเบอร์ละลายน้ำและสารต้านอนุมูลอิสระ ช่วยดูแลระบบขับถ่าย\n\nส่วนประกอบสำคัญ: NUTRIOSE® (ไฟเบอร์ละลายน้ำ), อิโปรน่า เลมอน, ใบบัว, เมล็ดชุมเห็ด, อินูลิน, วิตามินซี\n\nจุดเด่น: สนับสนุนจุลินทรีย์ชนิดดีในลำไส้ ลดท้องอืด บรรเทาท้องผูก ช่วยขับของเสียทางปัสสาวะ ผิวสดใส ช่วยควบคุมน้ำหนัก ใช้สารให้ความหวานจากธรรมชาติ\n\nวิธีรับประทาน: วันละ 1–2 เม็ด ควรทานก่อนนอน',
      'https://static.wixstatic.com/media/11e8bf_3fe57a8fd35b446ea61c75be7fe0bbca~mv2.png',
      array['https://static.wixstatic.com/media/11e8bf_3fe57a8fd35b446ea61c75be7fe0bbca~mv2.png','https://static.wixstatic.com/media/11e8bf_083cd689c6974627a53819c986d085a4~mv2.png','https://static.wixstatic.com/media/11e8bf_5c64e8ad73c847d3a471e03ef23c36ae~mv2.jpg','https://static.wixstatic.com/media/11e8bf_03735f9542e740d1870489cb8fe95db8~mv2.png']),
    (p_tenant, 'SAMPLE-06', 'MATCHA, PSP, CELONYA โปรตีนธัญพืช 43 ชนิด (700 กรัม)', 1290, null, 'โภชนาการ',
      E'ผงโภชนาการจากพืชและธัญพืชกว่า 43 ชนิด ให้สารอาหารครบถ้วนสำหรับไลฟ์สไตล์ที่กระฉับกระเฉง มีขนาด 700 กรัม, 900 กรัม และแบบซอง\n\nส่วนประกอบหลัก: มันเทศ ถั่วแดง ข้าวกล้อง เวย์ โอ๊ต บาร์เลย์ ถั่วเหลือง ควินัว ฟักทอง\n\nจุดเด่น: สนับสนุนกล้ามเนื้อและระบบเผาผลาญ เสริมภูมิคุ้มกัน ช่วยให้มีสมาธิ แข็งแรง และมีพลังงาน\n\nวิธีรับประทาน: ผง 1 สกู๊ป (ประมาณ 3–4 ช้อนโต๊ะ) กับน้ำ 250–300 มล. วันละ 1–2 มื้อ ใช้ทดแทนมื้ออาหารหรือทานหลังออกกำลังกาย',
      'https://static.wixstatic.com/media/11e8bf_2004b34e5b9f4ec98964255cef33e91a~mv2.jpg',
      array['https://static.wixstatic.com/media/11e8bf_2004b34e5b9f4ec98964255cef33e91a~mv2.jpg']),
    (p_tenant, 'SAMPLE-07', 'Happy Grain แฮปปี้เกรน เครื่องดื่มธัญพืช', 790, null, 'โภชนาการ',
      E'เครื่องดื่มธัญพืชรวม มี 2 ขนาดให้เลือกตามไลฟ์สไตล์และเป้าหมายสุขภาพ ทานง่ายทุกวัน\n\nจุดเด่น: สนับสนุนกล้ามเนื้อและระบบเผาผลาญ เสริมภูมิคุ้มกัน ให้พลังงานและสมาธิ\n\nวิธีรับประทาน: 1 สกู๊ป (3–4 ช้อนโต๊ะ) กับน้ำ 250–300 มล. วันละ 1–2 มื้อ',
      'https://static.wixstatic.com/media/11e8bf_ea3462727b4d4bac99d4942b9253d4e4~mv2.png',
      array['https://static.wixstatic.com/media/11e8bf_ea3462727b4d4bac99d4942b9253d4e4~mv2.png','https://static.wixstatic.com/media/11e8bf_aac6c85147514e7c88e6004ffe9dbed7~mv2.png']);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function seed_starter_shop(uuid, boolean) from public, anon, authenticated;

-- (ไม่บังคับ) ร้านเดิมที่มีสินค้าตัวอย่างผักผลไม้อยู่แล้ว: ลบแถวตัวอย่างเก่า แล้วโหลดชุดใหม่ (แทนที่ UUID ของร้าน)
-- order_items.product_id เป็น on delete set null จึงไม่กระทบประวัติออเดอร์
-- delete from products where tenant_id = '00000000-0000-0000-0000-000000000000' and sku like 'SAMPLE-%';
-- select seed_starter_shop('00000000-0000-0000-0000-000000000000', true);

notify pgrst, 'reload schema';
