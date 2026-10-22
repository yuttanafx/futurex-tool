-- P1: multi-tenant core (รันใน Supabase SQL Editor)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  plan_id text not null default 'free',
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create table tenant_members (
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','sales','content','viewer')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);
create table sales_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  slug text not null,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);
create table products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  sku text, name text not null, price numeric(12,2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index on tenant_members(user_id);
create index on sales_pages(tenant_id);

create function is_member(t uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists (select 1 from tenant_members where tenant_id = t and user_id = auth.uid()) $$;

alter table tenants enable row level security;
alter table tenant_members enable row level security;
alter table sales_pages enable row level security;
alter table products enable row level security;

create policy tenants_public_read on tenants for select using (status = 'active');
create policy tenants_member_update on tenants for update using (is_member(id));
create policy members_self_read on tenant_members for select using (user_id = auth.uid());
create policy pages_member_all on sales_pages for all using (is_member(tenant_id)) with check (is_member(tenant_id));
create policy pages_public_read on sales_pages for select using (status = 'published');
create policy products_member_all on products for all using (is_member(tenant_id)) with check (is_member(tenant_id));

-- สร้างร้านพร้อมผู้ใช้เป็น owner (ทำฝั่ง DB เพื่อไม่ให้ client กำหนด tenant เอง)
create function create_tenant(p_name text, p_slug text) returns uuid language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if exists (select 1 from tenant_members where user_id = auth.uid()) then raise exception 'already has tenant'; end if;
  insert into tenants(name, slug) values (p_name, p_slug) returning id into t;
  insert into tenant_members(tenant_id, user_id, role) values (t, auth.uid(), 'owner');
  return t;
end $$;
