-- ตะกร้าหลายสินค้า + ลิงก์แนะนำ/ผลงานตัวแทน (รันต่อจาก 006)
alter table tenants add column ref_code text unique default substr(md5(gen_random_uuid()::text), 1, 8);
update tenants set ref_code = substr(md5(gen_random_uuid()::text), 1, 8) where ref_code is null;
alter table orders add column referrer_tenant_id uuid references tenants(id) on delete set null;
create index on orders(referrer_tenant_id);
create table referrals (
  referrer_tenant uuid not null references tenants(id) on delete cascade,
  referred_tenant uuid not null unique references tenants(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index on referrals(referrer_tenant);
alter table referrals enable row level security; -- ไม่มี policy: อ่านผ่าน referral_stats() เท่านั้น

-- ผู้ใช้ทั่วไป (เจ้าของร้านเอง) แก้ผู้แนะนำของ order ไม่ได้ ตั้งได้เฉพาะผ่านฟังก์ชันสั่งซื้อ
create function lock_referrer() returns trigger language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then new.referrer_tenant_id := null; else new.referrer_tenant_id := old.referrer_tenant_id; end if;
  end if;
  return new;
end $$;
create trigger orders_lock_referrer before insert or update on orders for each row execute function lock_referrer();

drop function create_tenant(text, text);
create function create_tenant(p_name text, p_slug text, p_ref text default null) returns uuid language plpgsql security definer set search_path = public as $$
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
  return t;
end $$;

-- ตะกร้า: ราคาอ่านจาก DB เสมอ ผิดข้อใดข้อหนึ่งยกเลิกทั้งออเดอร์
create function place_order_cart(p_tenant uuid, p_items jsonb, p_name text, p_phone text, p_ref text default null) returns bigint
language plpgsql security definer set search_path = public as $$
declare it jsonb; pr products; c uuid; o orders; tot numeric := 0; q int; v_ref uuid; seen uuid[] := '{}';
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 or length(coalesce(p_name, '')) < 1 then
    raise exception 'invalid input';
  end if;
  if p_ref is not null then
    select id into v_ref from tenants where ref_code = lower(p_ref) and status = 'active' and id <> p_tenant;
  end if;
  insert into customers(tenant_id, name, phone) values (p_tenant, left(p_name, 120), left(p_phone, 30)) returning id into c;
  insert into orders(tenant_id, customer_id, referrer_tenant_id) values (p_tenant, c, v_ref) returning * into o;
  for it in select * from jsonb_array_elements(p_items) loop
    q := (it->>'qty')::int;
    if q < 1 or q > 100 then raise exception 'invalid qty'; end if;
    select * into pr from products where id = (it->>'product')::uuid and tenant_id = p_tenant and status = 'active';
    if not found then raise exception 'product not found'; end if;
    if pr.id = any(seen) then raise exception 'duplicate product'; end if;
    seen := seen || pr.id;
    insert into order_items(order_id, tenant_id, product_id, name, quantity, unit_price) values (o.id, p_tenant, pr.id, pr.name, q, pr.price);
    tot := tot + pr.price * q;
  end loop;
  update orders set total = tot where id = o.id;
  return o.order_no;
end $$;

-- ผลงานของผู้แนะนำ: เห็นยอดและชื่อร้านที่สมัครผ่านลิงก์ ไม่เห็นข้อมูลลูกค้า
create function referral_stats(t uuid) returns jsonb language sql stable security definer set search_path = public as $$
select jsonb_build_object(
  'code', (select ref_code from tenants where id = t),
  'orders', (select count(*) from orders where referrer_tenant_id = t and status <> 'cancelled'),
  'sales', (select coalesce(sum(total), 0) from orders where referrer_tenant_id = t and status <> 'cancelled'),
  'sales30', (select coalesce(sum(total), 0) from orders where referrer_tenant_id = t and status <> 'cancelled' and created_at > now() - interval '30 days'),
  'signups', (select count(*) from referrals where referrer_tenant = t),
  'recent_orders', coalesce((select jsonb_agg(x) from (select order_no, total, status, created_at from orders where referrer_tenant_id = t order by created_at desc limit 10) x), '[]'),
  'recent_signups', coalesce((select jsonb_agg(y) from (select tn.name, r.created_at from referrals r join tenants tn on tn.id = r.referred_tenant where r.referrer_tenant = t order by r.created_at desc limit 10) y), '[]'))
where is_member(t) $$;
