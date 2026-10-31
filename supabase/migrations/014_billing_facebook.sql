-- P7: ระบบเก็บค่าบริการ (บาท / PV / วอลเล็ต) + เชื่อมเพจ Facebook (รันต่อจาก 013)
-- ต้องรัน 010 (platform_admins) มาก่อน

-- ============================================================
-- 1) ค่าบริการ: ราคาที่แอดมินตั้งได้
-- ============================================================
-- ตั้งค่ารับเงินของแพลตฟอร์ม (แถวเดียว) · ไม่มี policy ฝั่งร้าน ร้านอ่านผ่าน billing_public() เท่านั้น
create table billing_settings (
  id int primary key default 1 check (id = 1),
  promptpay_id text,
  bank_name text, bank_account text, bank_account_name text,
  user_included int not null default 1 check (user_included >= 0),   -- ยูสเซอร์ที่รวมอยู่ในค่าเว็บแล้ว (ไม่คิดเงินเพิ่ม)
  grace_days int not null default 3 check (grace_days >= 0),         -- วันผ่อนผันหลังครบกำหนด
  updated_at timestamptz not null default now()
);
insert into billing_settings(id) values (1);
alter table billing_settings enable row level security;
create policy bs_admin_read on billing_settings for select using (is_platform_admin());

-- ราคา: ตั้งเป็นบาท / PV / วอลเล็ต ได้พร้อมกัน และเลือกได้ว่าให้จ่ายด้วยแบบไหน
create table billing_prices (
  code text primary key check (code in ('site', 'user', 'plan_starter', 'plan_pro', 'plan_business')),
  kind text not null check (kind in ('site', 'user', 'plan')),
  label text not null,
  price_thb numeric(12,2) not null default 0 check (price_thb >= 0),
  price_pv numeric(12,2) not null default 0 check (price_pv >= 0),
  price_wallet numeric(12,2) not null default 0 check (price_wallet >= 0),
  allow_thb boolean not null default true,
  allow_pv boolean not null default false,
  allow_wallet boolean not null default true,
  recommended boolean not null default false,   -- ชั้นแนะนำ (ใช้กับแพ็กเกจ)
  active boolean not null default true,
  sort int not null default 0,
  updated_at timestamptz not null default now()
);
insert into billing_prices(code, kind, label, recommended, sort) values
  ('site', 'site', 'ค่าบริการเว็บไซต์รายเดือน', false, 1),
  ('user', 'user', 'ค่ายูสเซอร์รายเดือน (ต่อ 1 ยูสเซอร์)', false, 2),
  ('plan_starter', 'plan', 'Starter', false, 10),
  ('plan_pro', 'plan', 'Pro', true, 11),
  ('plan_business', 'plan', 'Business', false, 12);
alter table billing_prices enable row level security;
create policy bp_public_read on billing_prices for select using (true);   -- ราคาแสดงหน้าแพ็กเกจสาธารณะอยู่แล้ว

-- ============================================================
-- 2) กระเป๋าเงิน / PV / วันครบกำหนดของแต่ละร้าน (แยกตารางจาก tenants เพราะสมาชิกร้านแก้ tenants ได้)
-- ============================================================
create table tenant_billing (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  wallet numeric(14,2) not null default 0 check (wallet >= 0),
  pv numeric(14,2) not null default 0 check (pv >= 0),
  paid_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table tenant_billing enable row level security;
create policy tb_member_read on tenant_billing for select using (is_member(tenant_id));
create policy tb_admin_read on tenant_billing for select using (is_platform_admin());
insert into tenant_billing(tenant_id) select id from tenants on conflict do nothing;

create function tenant_billing_init() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into tenant_billing(tenant_id) values (new.id) on conflict do nothing; return new; end $$;
create trigger tenants_billing_init after insert on tenants for each row execute function tenant_billing_init();

create table billing_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  unit text not null check (unit in ('wallet', 'pv')),
  amount numeric(14,2) not null,            -- + เข้า / − ออก
  balance_after numeric(14,2) not null,
  reason text not null,
  ref text,
  created_at timestamptz not null default now()
);
create index on billing_ledger(tenant_id, created_at desc);
alter table billing_ledger enable row level security;
create policy bl_member_read on billing_ledger for select using (is_member(tenant_id));
create policy bl_admin_read on billing_ledger for select using (is_platform_admin());

create table billing_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no bigint generated always as identity,
  tenant_id uuid not null references tenants(id) on delete cascade,
  kind text not null check (kind in ('subscription', 'topup')),
  method text not null check (method in ('thb', 'pv', 'wallet')),
  plan_id text,
  months int not null default 1 check (months between 1 and 12),
  items jsonb not null default '[]',
  amount numeric(14,2) not null check (amount > 0),   -- หน่วยตาม method
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected', 'cancelled')),
  slip_url text,
  note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index on billing_invoices(tenant_id, created_at desc);
create index on billing_invoices(status, created_at);
alter table billing_invoices enable row level security;
create policy bi_member_read on billing_invoices for select using (is_member(tenant_id));
create policy bi_admin_read on billing_invoices for select using (is_platform_admin());

-- ตารางทั้งหมดเขียนผ่านฟังก์ชันด้านล่างเท่านั้น
revoke insert, update, delete on billing_settings, billing_prices, tenant_billing, billing_ledger, billing_invoices from anon, authenticated;

-- กันสมาชิกร้านแก้ plan_id / status ของตัวเองผ่าน API (policy tenants_member_update เดิมเปิดทุกคอลัมน์)
-- ผ่านได้เมื่อ: แอดมินแพลตฟอร์ม / service_role / ฟังก์ชันชำระเงินของเรา (ตั้ง app.billing_bypass)
create function tenants_guard() returns trigger language plpgsql as $$
begin
  if (new.plan_id is distinct from old.plan_id or new.status is distinct from old.status)
     and auth.uid() is not null
     and coalesce(current_setting('app.billing_bypass', true), '') <> '1'
     and not is_platform_admin() then
    raise exception 'forbidden: plan/status can only be changed by billing or platform admin';
  end if;
  return new;
end $$;
create trigger tenants_guard before update on tenants for each row execute function tenants_guard();

-- ============================================================
-- 3) ฟังก์ชันภายใน: คำนวณยอด
-- ============================================================
-- p_method: thb | pv | wallet · คืน {ok, error?, items[], total}
create function billing_quote(p_tenant uuid, p_plan text, p_method text, p_months int) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  s billing_settings; pr billing_prices; n_users int; extra int; items jsonb := '[]'; tot numeric := 0;
  unit numeric; qty int; ok boolean; codes text[];
begin
  if p_method not in ('thb', 'pv', 'wallet') or p_months not between 1 and 12 then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  if p_plan not in ('free', 'starter', 'pro', 'business') then return jsonb_build_object('ok', false, 'error', 'invalid'); end if;
  select * into s from billing_settings where id = 1;
  select count(*) into n_users from tenant_members where tenant_id = p_tenant;
  extra := greatest(n_users - s.user_included, 0);
  codes := array['site', 'user'] || case when p_plan = 'free' then '{}'::text[] else array['plan_' || p_plan] end;
  for pr in select * from billing_prices where code = any(codes) and active order by sort loop
    qty := case pr.code when 'user' then extra else 1 end;
    unit := case p_method when 'thb' then pr.price_thb when 'pv' then pr.price_pv else pr.price_wallet end;
    ok := case p_method when 'thb' then pr.allow_thb when 'pv' then pr.allow_pv else pr.allow_wallet end;
    continue when qty = 0 or (unit = 0 and ok);       -- ราคา 0 ในหน่วยที่อนุญาต = ฟรี ไม่ต้องใส่ในใบแจ้งหนี้
    if not ok then return jsonb_build_object('ok', false, 'error', 'method_not_allowed', 'code', pr.code); end if;
    items := items || jsonb_build_object('code', pr.code, 'label', pr.label, 'qty', qty, 'months', p_months, 'unit_price', unit, 'total', unit * qty * p_months);
    tot := tot + unit * qty * p_months;
  end loop;
  return jsonb_build_object('ok', true, 'items', items, 'total', tot, 'users', n_users, 'extra_users', extra);
end $$;
revoke execute on function billing_quote(uuid, text, text, int) from public, anon, authenticated;

-- ต่ออายุ + เปลี่ยนแพ็กเกจ (ใช้ภายในเท่านั้น)
create function billing_activate(p_tenant uuid, p_plan text, p_months int) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform set_config('app.billing_bypass', '1', true);
  update tenants set plan_id = p_plan where id = p_tenant and plan_id is distinct from p_plan;
  update tenant_billing set paid_until = greatest(coalesce(paid_until, now()), now()) + make_interval(months => p_months), updated_at = now()
   where tenant_id = p_tenant;
end $$;
revoke execute on function billing_activate(uuid, text, int) from public, anon, authenticated;

-- ปรับยอดวอลเล็ต/PV (ล็อกแถว กันยอดติดลบ และบันทึกสมุดบัญชี)
create function billing_move(p_tenant uuid, p_unit text, p_amount numeric, p_reason text, p_ref text) returns numeric
language plpgsql security definer set search_path = public as $$
declare cur numeric; nb numeric;
begin
  if p_unit not in ('wallet', 'pv') then raise exception 'invalid unit'; end if;
  select case p_unit when 'wallet' then wallet else pv end into cur from tenant_billing where tenant_id = p_tenant for update;
  if not found then raise exception 'no billing row'; end if;
  nb := cur + p_amount;
  if nb < 0 then raise exception 'insufficient %', p_unit; end if;
  if p_unit = 'wallet' then update tenant_billing set wallet = nb, updated_at = now() where tenant_id = p_tenant;
  else update tenant_billing set pv = nb, updated_at = now() where tenant_id = p_tenant; end if;
  insert into billing_ledger(tenant_id, unit, amount, balance_after, reason, ref) values (p_tenant, p_unit, p_amount, nb, left(p_reason, 200), p_ref);
  return nb;
end $$;
revoke execute on function billing_move(uuid, text, numeric, text, text) from public, anon, authenticated;

-- ร้านของผู้ใช้ที่ล็อกอิน (เฉพาะ owner/admin จึงจ่ายเงินได้)
create function billing_my_tenant() returns uuid language sql stable security definer set search_path = public as $$
  select tenant_id from tenant_members where user_id = auth.uid() and role in ('owner', 'admin') order by (role = 'owner') desc limit 1 $$;
revoke execute on function billing_my_tenant() from public, anon, authenticated;

-- ============================================================
-- 4) ฟังก์ชันฝั่งร้าน
-- ============================================================
-- ข้อมูลรับเงินของแพลตฟอร์ม (แสดงในหน้าใบแจ้งหนี้) + กฎคิดเงิน
create function billing_public() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('promptpay_id', promptpay_id, 'bank_name', bank_name, 'bank_account', bank_account,
    'bank_account_name', bank_account_name, 'user_included', user_included, 'grace_days', grace_days)
  from billing_settings where id = 1 and auth.uid() is not null $$;

-- ชำระค่าบริการ: wallet/pv หักทันทีและต่ออายุ · thb สร้างใบแจ้งหนี้รอแนบสลิป
create function billing_pay(p_plan text, p_method text, p_months int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t uuid := billing_my_tenant(); q jsonb; inv billing_invoices; amt numeric;
begin
  if t is null then raise exception 'forbidden'; end if;
  q := billing_quote(t, p_plan, p_method, p_months);
  if not (q->>'ok')::boolean then raise exception '%', coalesce(q->>'error', 'invalid'); end if;
  amt := (q->>'total')::numeric;
  if amt <= 0 then raise exception 'nothing to pay'; end if;
  if p_method = 'thb' then
    if exists (select 1 from billing_invoices where tenant_id = t and status = 'pending' and kind = 'subscription' and method = 'thb') then
      raise exception 'pending invoice exists';
    end if;
    insert into billing_invoices(tenant_id, kind, method, plan_id, months, items, amount)
      values (t, 'subscription', 'thb', p_plan, p_months, q->'items', amt) returning * into inv;
    return jsonb_build_object('invoice', inv.id, 'status', 'pending');
  end if;
  insert into billing_invoices(tenant_id, kind, method, plan_id, months, items, amount, status, paid_at)
    values (t, 'subscription', p_method, p_plan, p_months, q->'items', amt, 'paid', now()) returning * into inv;
  perform billing_move(t, p_method, -amt, 'ชำระค่าบริการ #' || inv.invoice_no, inv.id::text);
  perform billing_activate(t, p_plan, p_months);
  return jsonb_build_object('invoice', inv.id, 'status', 'paid');
end $$;

-- ขอเติมวอลเล็ตด้วยการโอนเงิน (แอดมินตรวจสลิปแล้วอนุมัติ)
create function billing_topup_request(p_amount numeric) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t uuid := billing_my_tenant(); inv billing_invoices;
begin
  if t is null then raise exception 'forbidden'; end if;
  if p_amount is null or p_amount < 1 or p_amount > 1000000 then raise exception 'invalid amount'; end if;
  if (select count(*) from billing_invoices where tenant_id = t and status = 'pending' and kind = 'topup') >= 3 then raise exception 'too many pending'; end if;
  insert into billing_invoices(tenant_id, kind, method, items, amount)
    values (t, 'topup', 'thb', jsonb_build_array(jsonb_build_object('code', 'topup', 'label', 'เติมวอลเล็ต', 'qty', 1, 'unit_price', round(p_amount, 2), 'total', round(p_amount, 2))), round(p_amount, 2))
    returning * into inv;
  return jsonb_build_object('invoice', inv.id);
end $$;

create function billing_submit_slip(p_invoice uuid, p_url text) returns boolean
language plpgsql security definer set search_path = public as $$
declare t uuid := billing_my_tenant();
begin
  if t is null then raise exception 'forbidden'; end if;
  if p_url !~ '^https://' or length(p_url) > 600 then raise exception 'invalid url'; end if;
  update billing_invoices set slip_url = p_url where id = p_invoice and tenant_id = t and status = 'pending' and method = 'thb';
  return found;
end $$;

create function billing_cancel_invoice(p_invoice uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare t uuid := billing_my_tenant();
begin
  if t is null then raise exception 'forbidden'; end if;
  update billing_invoices set status = 'cancelled' where id = p_invoice and tenant_id = t and status = 'pending';
  return found;
end $$;

-- ============================================================
-- 5) ฟังก์ชันฝั่งแอดมินแพลตฟอร์ม
-- ============================================================
create function admin_save_price(
  p_code text, p_price_thb numeric, p_price_pv numeric, p_price_wallet numeric,
  p_allow_thb boolean, p_allow_pv boolean, p_allow_wallet boolean, p_active boolean, p_recommended boolean
) returns void language plpgsql security definer set search_path = public as $$
declare k text;
begin
  if not is_platform_admin() then raise exception 'forbidden'; end if;
  if p_price_thb < 0 or p_price_pv < 0 or p_price_wallet < 0 then raise exception 'invalid'; end if;
  if not (p_allow_thb or p_allow_pv or p_allow_wallet) then raise exception 'need at least one payment method'; end if;
  select kind into k from billing_prices where code = p_code;
  if not found then raise exception 'invalid code'; end if;
  if p_recommended and k = 'plan' then update billing_prices set recommended = false where kind = 'plan' and code <> p_code; end if;
  update billing_prices set price_thb = round(p_price_thb, 2), price_pv = round(p_price_pv, 2), price_wallet = round(p_price_wallet, 2),
    allow_thb = p_allow_thb, allow_pv = p_allow_pv, allow_wallet = p_allow_wallet, active = p_active,
    recommended = (k = 'plan' and p_recommended), updated_at = now()
   where code = p_code;
end $$;

create function admin_save_billing_settings(
  p_promptpay text, p_bank_name text, p_bank_account text, p_bank_account_name text, p_user_included int, p_grace_days int
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'forbidden'; end if;
  update billing_settings set promptpay_id = nullif(trim(p_promptpay), ''), bank_name = nullif(trim(p_bank_name), ''),
    bank_account = nullif(trim(p_bank_account), ''), bank_account_name = nullif(trim(p_bank_account_name), ''),
    user_included = greatest(p_user_included, 0), grace_days = greatest(p_grace_days, 0), updated_at = now() where id = 1;
end $$;

-- อนุมัติ/ปฏิเสธใบแจ้งหนี้ที่แนบสลิป
create function admin_review_invoice(p_invoice uuid, p_approve boolean, p_note text) returns void
language plpgsql security definer set search_path = public as $$
declare inv billing_invoices;
begin
  if not is_platform_admin() then raise exception 'forbidden'; end if;
  select * into inv from billing_invoices where id = p_invoice and status = 'pending' and method = 'thb' for update;
  if not found then raise exception 'not pending'; end if;
  if not p_approve then
    update billing_invoices set status = 'rejected', note = left(p_note, 300) where id = inv.id;
    return;
  end if;
  update billing_invoices set status = 'paid', paid_at = now(), note = left(p_note, 300) where id = inv.id;
  if inv.kind = 'topup' then
    perform billing_move(inv.tenant_id, 'wallet', inv.amount, 'เติมวอลเล็ต #' || inv.invoice_no, inv.id::text);
  else
    perform billing_activate(inv.tenant_id, inv.plan_id, inv.months);
  end if;
end $$;

-- แอดมินเพิ่ม/ลด วอลเล็ตหรือ PV ให้ร้าน (เช่น ให้ PV จากระบบสมาชิก)
create function admin_adjust_balance(p_tenant uuid, p_unit text, p_amount numeric, p_reason text) returns numeric
language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'forbidden'; end if;
  if p_amount = 0 or abs(p_amount) > 100000000 then raise exception 'invalid amount'; end if;
  return billing_move(p_tenant, p_unit, round(p_amount, 2), coalesce(nullif(trim(p_reason), ''), 'แอดมินปรับยอด'), null);
end $$;

-- ขยาย/ลดวันใช้งาน (ให้ใช้ฟรีเพิ่ม หรือแก้ไข)
create function admin_adjust_paid_until(p_tenant uuid, p_days int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'forbidden'; end if;
  if abs(p_days) > 3650 then raise exception 'invalid'; end if;
  update tenant_billing set paid_until = greatest(coalesce(paid_until, now()), now()) + make_interval(days => p_days), updated_at = now() where tenant_id = p_tenant;
end $$;

revoke execute on function billing_public(), billing_pay(text, text, int), billing_topup_request(numeric), billing_submit_slip(uuid, text), billing_cancel_invoice(uuid),
  admin_save_price(text, numeric, numeric, numeric, boolean, boolean, boolean, boolean, boolean),
  admin_save_billing_settings(text, text, text, text, int, int), admin_review_invoice(uuid, boolean, text),
  admin_adjust_balance(uuid, text, numeric, text), admin_adjust_paid_until(uuid, int) from public, anon;
grant execute on function billing_public(), billing_pay(text, text, int), billing_topup_request(numeric), billing_submit_slip(uuid, text), billing_cancel_invoice(uuid),
  admin_save_price(text, numeric, numeric, numeric, boolean, boolean, boolean, boolean, boolean),
  admin_save_billing_settings(text, text, text, text, int, int), admin_review_invoice(uuid, boolean, text),
  admin_adjust_balance(uuid, text, numeric, text), admin_adjust_paid_until(uuid, int) to authenticated;

-- ============================================================
-- 6) Facebook Pages (เซลเพจ → เก็บเพจ, โพสต์คอนเทนต์, AI ตอบแชท Messenger)
-- ============================================================
create table fb_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  page_id text not null unique,          -- เพจหนึ่งผูกกับร้านเดียวเท่านั้น (ใช้จับคู่ webhook)
  name text not null, category text, picture_url text,
  auto_reply boolean not null default false,
  connected_at timestamptz not null default now()
);
create index on fb_pages(tenant_id);
alter table fb_pages enable row level security;
create policy fbp_member_read on fb_pages for select using (is_member(tenant_id));

-- Page access token (เข้ารหัส AES-256-GCM ฝั่งเซิร์ฟเวอร์) · เปิด RLS ไม่มี policy = เฉพาะ service_role
create table fb_page_tokens (
  page_id text primary key references fb_pages(page_id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  enc text not null,
  updated_at timestamptz not null default now()
);
alter table fb_page_tokens enable row level security;

create table fb_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  page_id text not null,
  message text not null,
  fb_post_id text,
  created_at timestamptz not null default now()
);
create index on fb_posts(tenant_id, created_at desc);
alter table fb_posts enable row level security;
create policy fbpost_member_read on fb_posts for select using (is_member(tenant_id));
revoke insert, update, delete on fb_pages, fb_page_tokens, fb_posts from anon, authenticated;

alter table conversations add column page_id text;   -- เพจที่ลูกค้าแชทเข้ามา (channel = 'facebook')

notify pgrst, 'reload schema';
