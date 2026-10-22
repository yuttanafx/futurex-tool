-- แอดมินผู้ดูแลทั้งแพลตฟอร์ม: ดูยอด/การใช้งานของทุกร้าน ระงับร้าน เปลี่ยนแพ็กเกจ (รันต่อจาก 009)
create table platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table platform_admins enable row level security; -- ไม่มี policy: จัดการผ่าน SQL Editor เท่านั้น

create function is_platform_admin() returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from platform_admins where user_id = auth.uid()) $$;

-- ภาพรวมทั้งแพลตฟอร์ม (ยอดขายไม่นับออเดอร์ที่ยกเลิก)
create function admin_overview() returns jsonb language sql stable security definer set search_path = public as $$
select jsonb_build_object(
  'shops', (select count(*) from tenants),
  'active_shops', (select count(*) from tenants where status = 'active'),
  'new_shops_7d', (select count(*) from tenants where created_at > now() - interval '7 days'),
  'products', (select count(*) from products),
  'orders', (select count(*) from orders where status <> 'cancelled'),
  'orders_30d', (select count(*) from orders where status <> 'cancelled' and created_at > now() - interval '30 days'),
  'sales', (select coalesce(sum(total), 0) from orders where status <> 'cancelled'),
  'sales_30d', (select coalesce(sum(total), 0) from orders where status <> 'cancelled' and created_at > now() - interval '30 days'),
  'paid_sales', (select coalesce(sum(total), 0) from orders where status <> 'cancelled' and payment_status = 'paid'),
  'plans', coalesce((select jsonb_object_agg(plan_id, n) from (select plan_id, count(*) n from tenants group by plan_id) p), '{}'),
  'daily', (select jsonb_agg(jsonb_build_object('day', d::date,
      'sales', (select coalesce(sum(o.total), 0) from orders o where o.status <> 'cancelled' and (o.created_at at time zone 'Asia/Bangkok')::date = d::date),
      'orders', (select count(*) from orders o where o.status <> 'cancelled' and (o.created_at at time zone 'Asia/Bangkok')::date = d::date),
      'shops', (select count(*) from tenants t where (t.created_at at time zone 'Asia/Bangkok')::date = d::date)) order by d)
    from generate_series((now() at time zone 'Asia/Bangkok')::date - 13, (now() at time zone 'Asia/Bangkok')::date, interval '1 day') d)
) where is_platform_admin() $$;

-- รายการทุกร้าน เรียงตามยอดขาย
create function admin_shops() returns jsonb language sql stable security definer set search_path = public as $$
select coalesce(jsonb_agg(x order by (x->>'sales')::numeric desc, x->>'created_at' desc), '[]') from (
  select jsonb_build_object(
    'id', t.id, 'name', t.name, 'slug', t.slug, 'plan_id', t.plan_id, 'status', t.status, 'created_at', t.created_at,
    'owner_email', (select u.email from tenant_members m join auth.users u on u.id = m.user_id where m.tenant_id = t.id order by (m.role = 'owner') desc limit 1),
    'products', (select count(*) from products p where p.tenant_id = t.id),
    'orders', (select count(*) from orders o where o.tenant_id = t.id and o.status <> 'cancelled'),
    'sales', (select coalesce(sum(o.total), 0) from orders o where o.tenant_id = t.id and o.status <> 'cancelled'),
    'sales_30d', (select coalesce(sum(o.total), 0) from orders o where o.tenant_id = t.id and o.status <> 'cancelled' and o.created_at > now() - interval '30 days'),
    'last_order_at', (select max(o.created_at) from orders o where o.tenant_id = t.id)) x
  from tenants t) s
where is_platform_admin() $$;

-- รายละเอียดร้านเดียว (ไม่ส่งข้อมูลส่วนตัวของลูกค้า)
create function admin_shop_detail(p_id uuid) returns jsonb language sql stable security definer set search_path = public as $$
select jsonb_build_object(
  'shop', jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug, 'plan_id', t.plan_id, 'status', t.status, 'created_at', t.created_at,
     'owner_email', (select u.email from tenant_members m join auth.users u on u.id = m.user_id where m.tenant_id = t.id order by (m.role = 'owner') desc limit 1),
     'promptpay', t.promptpay_id is not null, 'bank', t.bank_account is not null, 'cod', t.cod_enabled),
  'products', (select count(*) from products p where p.tenant_id = t.id),
  'active_products', (select count(*) from products p where p.tenant_id = t.id and p.status = 'active'),
  'customers', (select count(*) from customers c where c.tenant_id = t.id),
  'orders', (select count(*) from orders o where o.tenant_id = t.id and o.status <> 'cancelled'),
  'sales', (select coalesce(sum(o.total), 0) from orders o where o.tenant_id = t.id and o.status <> 'cancelled'),
  'paid_sales', (select coalesce(sum(o.total), 0) from orders o where o.tenant_id = t.id and o.status <> 'cancelled' and o.payment_status = 'paid'),
  'ai_used_today', ai_used_today(t.id),
  'recent_orders', coalesce((select jsonb_agg(r) from (select order_no, total, status, payment_status, payment_method, created_at from orders o where o.tenant_id = t.id order by created_at desc limit 20) r), '[]'),
  'top_products', coalesce((select jsonb_agg(q) from (select i.name, sum(i.quantity) qty, sum(i.quantity * i.unit_price) revenue from order_items i join orders o on o.id = i.order_id where i.tenant_id = t.id and o.status <> 'cancelled' group by i.name order by revenue desc limit 5) q), '[]')
) from tenants t where t.id = p_id and is_platform_admin() $$;

-- ระงับ/เปิดร้าน และเปลี่ยนแพ็กเกจ (ร้านที่ถูกระงับจะเปิดหน้าร้านไม่ได้)
create function admin_update_tenant(p_id uuid, p_status text, p_plan text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'forbidden'; end if;
  if p_status not in ('active', 'suspended') or p_plan not in ('free', 'starter', 'pro', 'business') then raise exception 'invalid'; end if;
  update tenants set status = p_status, plan_id = p_plan where id = p_id;
end $$;

revoke execute on function is_platform_admin(), admin_overview(), admin_shops(), admin_shop_detail(uuid), admin_update_tenant(uuid, text, text) from public, anon;
grant execute on function is_platform_admin(), admin_overview(), admin_shops(), admin_shop_detail(uuid), admin_update_tenant(uuid, text, text) to authenticated;

-- ตั้งตัวเองเป็นแอดมิน: แก้อีเมลให้ตรงกับบัญชีที่ใช้ล็อกอิน แล้วรันบรรทัดนี้ (ทำครั้งเดียว)
-- insert into platform_admins(user_id) select id from auth.users where email = 'อีเมลของคุณ';
notify pgrst, 'reload schema';
