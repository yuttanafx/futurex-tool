-- P6: ให้แต่ละร้านใส่ API key ของ AI เอง (Claude / GPT / Gemini) (รันต่อจาก 012)
-- key เก็บแบบเข้ารหัสฝั่งเซิร์ฟเวอร์ (AES-256-GCM ด้วย env AI_KEY_SECRET) เปิด RLS โดยไม่มี policy = เฉพาะ service_role เข้าถึงได้
create table tenant_ai_keys (
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null check (provider in ('gemini', 'anthropic', 'openai')),
  enc text not null,
  last4 text not null,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, provider)
);
create table tenant_ai_prefs (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  provider text not null check (provider in ('gemini', 'anthropic', 'openai')),
  model text not null default '',
  updated_at timestamptz not null default now()
);
alter table tenant_ai_keys enable row level security;
alter table tenant_ai_prefs enable row level security;
revoke all on tenant_ai_keys, tenant_ai_prefs from anon, authenticated;

-- ถ้าร้านใช้ key ของตัวเอง ต้นทุนเป็นของร้าน จึงไม่นับเข้าโควตา AI รายวันของแพ็กเกจ
-- แต่ยังมีเพดานกันเหตุฉุกเฉิน (10 เท่าของโควตาแพ็กเกจ/วัน) เพราะแชทหน้าร้านเปิดสาธารณะ ใครก็ส่งข้อความได้ กันเครดิตของร้านถูกใช้หมดจากการยิงข้อความรัว
alter table ai_usage add column byok boolean not null default false;
create or replace function ai_used_today(t uuid) returns int language sql stable security definer set search_path = public as
$$ select count(*)::int from ai_usage where tenant_id = t and not byok and (created_at at time zone 'Asia/Bangkok')::date = (now() at time zone 'Asia/Bangkok')::date $$;

create function ai_begin(t uuid, byok boolean) returns jsonb language plpgsql security definer set search_path = public as $$
declare tn tenants; ag ai_agents; prods jsonb;
begin
  select * into tn from tenants where id = t and status = 'active';
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  select * into ag from ai_agents where tenant_id = t;
  if found and not ag.enabled then return jsonb_build_object('ok', false, 'reason', 'disabled'); end if;
  if not byok and ai_used_today(t) >= ai_limit(tn.plan_id) then return jsonb_build_object('ok', false, 'reason', 'quota'); end if;
  if byok and (select count(*) from ai_usage where tenant_id = t and (created_at at time zone 'Asia/Bangkok')::date = (now() at time zone 'Asia/Bangkok')::date) >= ai_limit(tn.plan_id) * 10 then
    return jsonb_build_object('ok', false, 'reason', 'quota');
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('name', name, 'price', price)), '[]') into prods
    from (select name, price from products where tenant_id = t and status = 'active' limit 50) x;
  return jsonb_build_object('ok', true, 'shop', tn.name, 'instructions', coalesce(ag.instructions, ''), 'products', prods);
end $$;
create function ai_log(t uuid, conv uuid, q text, a text, mdl text, units int, byok boolean) returns uuid language plpgsql security definer set search_path = public as $$
declare c uuid := conv;
begin
  if c is null or not exists (select 1 from conversations where id = c and tenant_id = t) then
    insert into conversations(tenant_id) values (t) returning id into c;
  end if;
  insert into messages(conversation_id, tenant_id, sender_type, content) values (c, t, 'customer', left(q, 1000)), (c, t, 'ai', left(a, 4000));
  insert into ai_usage(tenant_id, model, usage_units, byok) values (t, mdl, greatest(units, 0), byok);
  return c;
end $$;
revoke execute on function ai_begin(uuid, boolean), ai_log(uuid, uuid, text, text, text, int, boolean) from public, anon, authenticated;
grant execute on function ai_begin(uuid, boolean), ai_log(uuid, uuid, text, text, text, int, boolean) to service_role;
