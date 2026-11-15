-- แอดมินแพลตฟอร์มเข้า "จัดการร้านแทนสมาชิก" (รันต่อจาก 014)
-- ไม่แตะรหัสผ่านสมาชิก: เก็บแค่ว่าแอดมินคนไหนกำลังจัดการร้านไหน แล้ว is_member() ยอมรับเฉพาะร้านนั้น
create table admin_impersonations (
  admin_id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  started_at timestamptz not null default now()
);
create table admin_audit (
  id bigserial primary key,
  admin_id uuid not null,
  tenant_id uuid not null,
  action text not null check (action in ('start', 'stop')),
  created_at timestamptz not null default now()
);
alter table admin_impersonations enable row level security;
alter table admin_audit enable row level security;
revoke all on admin_impersonations, admin_audit from anon, authenticated;

-- policy ทุกตัวของแอปใช้ is_member() อยู่แล้ว จึงเพิ่มเงื่อนไขแอดมินที่นี่ที่เดียว
create or replace function is_member(t uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from tenant_members where tenant_id = t and user_id = auth.uid())
   or (is_platform_admin() and exists (select 1 from admin_impersonations where admin_id = auth.uid() and tenant_id = t)) $$;

create function admin_impersonate_start(p_tenant uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not is_platform_admin() then raise exception 'not allowed'; end if;
  if not exists (select 1 from tenants where id = p_tenant) then raise exception 'shop not found'; end if;
  insert into admin_impersonations(admin_id, tenant_id) values (auth.uid(), p_tenant)
    on conflict (admin_id) do update set tenant_id = excluded.tenant_id, started_at = now();
  insert into admin_audit(admin_id, tenant_id, action) values (auth.uid(), p_tenant, 'start');
end $$;

create function admin_impersonate_stop() returns void language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if not is_platform_admin() then return; end if;
  delete from admin_impersonations where admin_id = auth.uid() returning tenant_id into t;
  if t is not null then insert into admin_audit(admin_id, tenant_id, action) values (auth.uid(), t, 'stop'); end if;
end $$;

-- ร้านที่แอดมินกำลังจัดการอยู่ (ว่างถ้าไม่ได้จัดการร้านใด)
create function admin_impersonated_tenant() returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)
  from admin_impersonations i join tenants t on t.id = i.tenant_id
  where i.admin_id = auth.uid() and is_platform_admin() $$;

grant execute on function admin_impersonate_start(uuid), admin_impersonate_stop(), admin_impersonated_tenant() to authenticated;
