-- P3: AI ตอบแชท + โควตา (รันต่อจาก 002)
create table ai_agents (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  enabled boolean not null default true,
  instructions text not null default '',
  updated_at timestamptz not null default now()
);
create table ai_usage (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  model text not null, usage_units int not null default 0,
  created_at timestamptz not null default now()
);
create table conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  channel text not null default 'web',
  created_at timestamptz not null default now()
);
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  sender_type text not null check (sender_type in ('customer','ai','staff')),
  content text not null,
  created_at timestamptz not null default now()
);
create index on ai_usage(tenant_id, created_at desc);
create index on messages(tenant_id, created_at desc);
alter table ai_agents enable row level security;
alter table ai_usage enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
create policy agents_member_all on ai_agents for all using (is_member(tenant_id)) with check (is_member(tenant_id));
create policy usage_member_read on ai_usage for select using (is_member(tenant_id));
create policy conv_member_read on conversations for select using (is_member(tenant_id));
create policy msg_member_read on messages for select using (is_member(tenant_id));

-- โควตาข้อความ AI ต่อวัน (เวลาไทย) ตามแพ็กเกจ ปรับตัวเลขได้ตามต้นทุนจริง
create function ai_limit(plan text) returns int language sql immutable as
$$ select case plan when 'starter' then 200 when 'pro' then 1000 when 'business' then 5000 else 30 end $$;
create function ai_used_today(t uuid) returns int language sql stable security definer set search_path = public as
$$ select count(*)::int from ai_usage where tenant_id = t and (created_at at time zone 'Asia/Bangkok')::date = (now() at time zone 'Asia/Bangkok')::date $$;
create function ai_quota(t uuid) returns jsonb language sql stable security definer set search_path = public as
$$ select jsonb_build_object('used', ai_used_today(t), 'limit', ai_limit(plan_id)) from tenants where id = t and is_member(t) $$;

-- สองฟังก์ชันนี้เรียกได้เฉพาะ service_role (เซิร์ฟเวอร์ของเราเท่านั้น)
create function ai_begin(t uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare tn tenants; ag ai_agents; prods jsonb;
begin
  select * into tn from tenants where id = t and status = 'active';
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  select * into ag from ai_agents where tenant_id = t;
  if found and not ag.enabled then return jsonb_build_object('ok', false, 'reason', 'disabled'); end if;
  if ai_used_today(t) >= ai_limit(tn.plan_id) then return jsonb_build_object('ok', false, 'reason', 'quota'); end if;
  select coalesce(jsonb_agg(jsonb_build_object('name', name, 'price', price)), '[]') into prods
    from (select name, price from products where tenant_id = t and status = 'active' limit 50) x;
  return jsonb_build_object('ok', true, 'shop', tn.name, 'instructions', coalesce(ag.instructions, ''), 'products', prods);
end $$;
create function ai_log(t uuid, conv uuid, q text, a text, mdl text, units int) returns uuid language plpgsql security definer set search_path = public as $$
declare c uuid := conv;
begin
  if c is null or not exists (select 1 from conversations where id = c and tenant_id = t) then
    insert into conversations(tenant_id) values (t) returning id into c;
  end if;
  insert into messages(conversation_id, tenant_id, sender_type, content) values (c, t, 'customer', left(q, 1000)), (c, t, 'ai', left(a, 4000));
  insert into ai_usage(tenant_id, model, usage_units) values (t, mdl, greatest(units, 0));
  return c;
end $$;
revoke execute on function ai_begin(uuid), ai_log(uuid, uuid, text, text, text, int) from public, anon, authenticated;
grant execute on function ai_begin(uuid), ai_log(uuid, uuid, text, text, text, int) to service_role;
