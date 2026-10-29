-- ร้านใหม่เริ่มต้นด้วยหน้าร้านพื้นฐาน (แบนเนอร์ สโลแกน เกี่ยวกับร้าน) + สินค้าตัวอย่าง 7 รายการ (รันต่อจาก 009)
-- ทุกอย่างผูก tenant_id ของร้านนั้น และอยู่ใต้ RLS เดิม → แต่ละบัญชีเห็น/แก้/ลบได้เฉพาะของร้านตัวเอง
-- รูปตัวอย่างเป็นไฟล์สาธารณะใน public/starter/ (ใช้ร่วมกันได้ ไม่ใช่ข้อมูลของใคร) เจ้าของร้านเปลี่ยน/ลบได้ที่ /app/products และ /app/settings

alter table tenants add column about text;

-- ภายในเท่านั้น: เรียกจาก create_tenant / load_starter_products (ห้ามเรียกจากเบราว์เซอร์)
create function seed_starter_shop(p_tenant uuid, p_site boolean) returns int language plpgsql security definer set search_path = public as $$
declare n int := 0;
begin
  if p_site then  -- ตั้งค่าหน้าร้านเฉพาะค่าที่ยังว่าง ไม่ทับของเดิม
    update tenants set
      tagline = coalesce(tagline, 'ผักผลไม้สดคัดสรร ส่งตรงถึงบ้าน'),
      about = coalesce(about, 'ยินดีต้อนรับสู่ร้านของเรา เราคัดผักและผลไม้สดทุกวัน แพ็กอย่างดี และจัดส่งถึงบ้านคุณ เลือกสินค้าใส่ตะกร้า กรอกที่อยู่ แล้วชำระเงินได้ทันที หากมีคำถามสอบถามผู้ช่วยของร้านได้ตลอดเวลา'),
      banner_url = coalesce(banner_url, '/starter/banner.jpg')
    where id = p_tenant;
  end if;
  if exists (select 1 from products where tenant_id = p_tenant) then return 0; end if;  -- มีสินค้าอยู่แล้วไม่เพิ่มซ้ำ
  insert into products (tenant_id, sku, name, price, compare_price, category, description, image_url, images) values
    (p_tenant, 'SAMPLE-01', 'เคลใบหยิกสด (250 กรัม)', 89, 109, 'ผักสด', 'เคลใบหยิกสด คัดใบสวย เหมาะกับสลัด สมูทตี้ และผัดเร็ว ๆ ล้างง่าย เก็บในตู้เย็นได้หลายวัน', '/starter/kale.jpg', array['/starter/kale.jpg']),
    (p_tenant, 'SAMPLE-02', 'อะโวคาโดสุกพอดี (แพ็ก 2 ลูก)', 129, 159, 'ผลไม้สด', 'อะโวคาโดเนื้อเนียนครีมมี่ พร้อมทานกับขนมปัง สลัด หรือปั่นเป็นสมูทตี้', '/starter/avocado.jpg', array['/starter/avocado.jpg']),
    (p_tenant, 'SAMPLE-03', 'บรอกโคลีสด (300 กรัม)', 59, null, 'ผักสด', 'บรอกโคลีดอกแน่น สีเขียวสด ลวก นึ่ง หรือผัดก็อร่อย', '/starter/broccoli.jpg', array['/starter/broccoli.jpg']),
    (p_tenant, 'SAMPLE-04', 'พริกหวานแดง (แพ็ก 3 ลูก)', 79, null, 'ผักสด', 'พริกหวานสีแดงสด เนื้อหนา กรอบ หวาน ใช้ทำสลัด ผัด หรือย่าง', '/starter/pepper.jpg', array['/starter/pepper.jpg']),
    (p_tenant, 'SAMPLE-05', 'แครอทสด (500 กรัม)', 49, null, 'ผักสด', 'แครอทเนื้อกรอบ หวานธรรมชาติ ทานสดหรือปรุงอาหารได้หลากหลาย', '/starter/carrots.jpg', array['/starter/carrots.jpg']),
    (p_tenant, 'SAMPLE-06', 'บลูเบอร์รี่สด (125 กรัม)', 149, 189, 'ผลไม้สด', 'บลูเบอร์รี่ลูกโต หวานอมเปรี้ยว ทานเล่น ใส่โยเกิร์ต หรือโอ๊ตมีล', '/starter/blueberries.jpg', array['/starter/blueberries.jpg']),
    (p_tenant, 'SAMPLE-07', 'แอปเปิ้ลเขียว (แพ็ก 4 ลูก)', 99, null, 'ผลไม้สด', 'แอปเปิ้ลเขียวกรอบ ฉ่ำ เปรี้ยวหวานพอดี เหมาะทานสดหรือหั่นใส่สลัด', '/starter/apples.jpg', array['/starter/apples.jpg']);
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function seed_starter_shop(uuid, boolean) from public, anon, authenticated;

-- สร้างร้านใหม่ = ใส่หน้าร้านและสินค้าตัวอย่างให้ทันที (สัญญาณเดิมจาก 007 + บรรทัด seed)
create or replace function create_tenant(p_name text, p_slug text, p_ref text default null) returns uuid language plpgsql security definer set search_path = public as $$
declare t uuid; r uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from tenant_members where user_id = auth.uid()) then raise exception 'already has tenant'; end if;
  insert into tenants(name, slug) values (p_name, p_slug) returning id into t;
  insert into tenant_members(tenant_id, user_id, role) values (t, auth.uid(), 'owner');
  if p_ref is not null then
    select id into r from tenants where ref_code = lower(p_ref) and status = 'active' and id <> t;
    if r is not null then insert into referrals(referrer_tenant, referred_tenant) values (r, t) on conflict do nothing; end if;
  end if;
  perform seed_starter_shop(t, true);
  return t;
end $$;

-- ร้านเดิมที่ยังไม่มีสินค้า: เจ้าของกดโหลดสินค้าตัวอย่างเองได้ (ไม่มีพารามิเตอร์ร้าน → ใส่ได้เฉพาะร้านของตัวเอง ไม่ทับสินค้าที่มี)
create function load_starter_products() returns int language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  select tenant_id into t from tenant_members where user_id = auth.uid() and role in ('owner', 'admin') order by created_at limit 1;
  if t is null then raise exception 'no permission'; end if;
  return seed_starter_shop(t, false);
end $$;
revoke all on function load_starter_products() from public, anon;
grant execute on function load_starter_products() to authenticated;

-- (ไม่บังคับ) ใส่หน้าร้านพื้นฐานให้ร้านเดิมของคุณ: รันใน SQL Editor โดยแทนที่ UUID ของร้าน
-- select seed_starter_shop('00000000-0000-0000-0000-000000000000', true);

notify pgrst, 'reload schema';
