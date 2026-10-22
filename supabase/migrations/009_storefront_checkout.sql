-- หน้าร้านแบบอีคอมเมิร์ซ: รูปหลายรูป สต็อก หมวดหมู่ ค่าส่ง ช่องทางชำระเงิน สลิป (รันต่อจาก 008)

-- ===== สินค้า =====
alter table products
  add column images text[] not null default '{}',
  add column compare_price numeric(12,2) check (compare_price is null or compare_price >= 0),
  add column stock int check (stock is null or stock >= 0),   -- null = ไม่จำกัดสต็อก
  add column category text;
update products set images = array[image_url] where image_url is not null and images = '{}';
create index on products(tenant_id, category);

-- ===== ร้านค้า: ข้อมูลหน้าร้าน ค่าส่ง ช่องทางรับเงิน =====
alter table tenants
  add column tagline text,
  add column banner_url text,
  add column shipping_fee numeric(12,2) not null default 0 check (shipping_fee >= 0),
  add column free_shipping_over numeric(12,2) check (free_shipping_over is null or free_shipping_over >= 0),
  add column promptpay_id text,          -- เบอร์โทร 10 หลัก หรือเลขบัตร/ภาษี 13 หลัก
  add column bank_name text,
  add column bank_account text,
  add column bank_account_name text,
  add column cod_enabled boolean not null default false;

-- ===== คำสั่งซื้อ =====
alter table orders
  add column public_token uuid not null default gen_random_uuid() unique, -- ลิงก์ติดตามออเดอร์ของลูกค้า (เดาไม่ได้)
  add column ship_address text,
  add column payment_method text not null default 'later' check (payment_method in ('promptpay','bank','cod','later')),
  add column shipping_fee numeric(12,2) not null default 0,
  add column slip_url text,
  add column note text;

-- ===== สั่งซื้อพร้อมที่อยู่ + ช่องทางชำระ: ราคา/ค่าส่ง/สต็อก คำนวณจาก DB เสมอ =====
create function place_order_checkout(
  p_tenant uuid, p_items jsonb, p_name text, p_phone text, p_address text,
  p_method text, p_note text default null, p_ref text default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare t tenants; it jsonb; pr products; c uuid; o orders; tot numeric := 0; q int; v_ref uuid; seen uuid[] := '{}'; ship numeric := 0;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20
     or length(coalesce(trim(p_name), '')) < 1 or length(coalesce(trim(p_phone), '')) < 8
     or length(coalesce(trim(p_address), '')) < 5 then
    raise exception 'invalid input';
  end if;
  select * into t from tenants where id = p_tenant and status = 'active';
  if not found then raise exception 'shop not found'; end if;
  if p_method not in ('promptpay','bank','cod','later')
     or (p_method = 'promptpay' and coalesce(t.promptpay_id, '') = '')
     or (p_method = 'bank' and coalesce(t.bank_account, '') = '')
     or (p_method = 'cod' and not t.cod_enabled) then
    raise exception 'payment method unavailable';
  end if;
  if p_ref is not null then
    select id into v_ref from tenants where ref_code = lower(p_ref) and status = 'active' and id <> p_tenant;
  end if;
  insert into customers(tenant_id, name, phone) values (p_tenant, left(trim(p_name), 120), left(trim(p_phone), 30)) returning id into c;
  insert into orders(tenant_id, customer_id, referrer_tenant_id, ship_address, payment_method, note)
    values (p_tenant, c, v_ref, left(trim(p_address), 500), p_method, left(nullif(trim(coalesce(p_note, '')), ''), 500)) returning * into o;
  for it in select * from jsonb_array_elements(p_items) loop
    q := (it->>'qty')::int;
    if q < 1 or q > 100 then raise exception 'invalid qty'; end if;
    select * into pr from products where id = (it->>'product')::uuid and tenant_id = p_tenant and status = 'active' for update;
    if not found then raise exception 'product not found'; end if;
    if pr.id = any(seen) then raise exception 'duplicate product'; end if;
    seen := seen || pr.id;
    if pr.stock is not null then
      if pr.stock < q then raise exception 'out of stock: %', pr.name; end if;
      update products set stock = stock - q where id = pr.id;
    end if;
    insert into order_items(order_id, tenant_id, product_id, name, quantity, unit_price) values (o.id, p_tenant, pr.id, pr.name, q, pr.price);
    tot := tot + pr.price * q;
  end loop;
  if t.shipping_fee > 0 and not (t.free_shipping_over is not null and tot >= t.free_shipping_over) then ship := t.shipping_fee; end if;
  update orders set total = tot + ship, shipping_fee = ship where id = o.id;
  return jsonb_build_object('token', o.public_token, 'order_no', o.order_no);
end $$;

-- ===== ลูกค้าดูออเดอร์ของตัวเองด้วย token (ไม่เปิดตาราง orders ให้ anon) =====
create function get_order_public(p_token uuid) returns jsonb language sql stable security definer set search_path = public as $$
select jsonb_build_object(
  'order_no', o.order_no, 'status', o.status, 'payment_status', o.payment_status, 'payment_method', o.payment_method,
  'total', o.total, 'shipping_fee', o.shipping_fee, 'slip_url', o.slip_url, 'created_at', o.created_at,
  'ship_address', o.ship_address, 'note', o.note,
  'customer', (select jsonb_build_object('name', c.name, 'phone', c.phone) from customers c where c.id = o.customer_id),
  'items', coalesce((select jsonb_agg(jsonb_build_object('name', i.name, 'quantity', i.quantity, 'unit_price', i.unit_price)) from order_items i where i.order_id = o.id), '[]'),
  'shop', jsonb_build_object('name', t.name, 'slug', t.slug, 'promptpay_id', t.promptpay_id,
          'bank_name', t.bank_name, 'bank_account', t.bank_account, 'bank_account_name', t.bank_account_name))
from orders o join tenants t on t.id = o.tenant_id where o.public_token = p_token $$;

-- ลูกค้าแนบสลิป (เฉพาะออเดอร์ที่ยังไม่ชำระและเป็นโอน/พร้อมเพย์)
create function submit_payment_slip(p_token uuid, p_url text) returns boolean language plpgsql security definer set search_path = public as $$
begin
  if p_url !~ '^https://' or length(p_url) > 600 then raise exception 'invalid url'; end if;
  update orders set slip_url = p_url
   where public_token = p_token and payment_status = 'unpaid' and payment_method in ('promptpay','bank');
  return found;
end $$;

-- ===== Storage: รูปสินค้า/แบนเนอร์ (สมาชิกอัปโหลดในโฟลเดอร์ของร้านตัวเอง) และสลิป (ลูกค้าอัปโหลดได้) =====
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('shop-media', 'shop-media', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('slips', 'slips', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy shop_media_member_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'shop-media' and is_member(((storage.foldername(name))[1])::uuid));
create policy shop_media_member_delete on storage.objects for delete to authenticated
  using (bucket_id = 'shop-media' and is_member(((storage.foldername(name))[1])::uuid));
create policy slips_public_insert on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'slips');

notify pgrst, 'reload schema';
