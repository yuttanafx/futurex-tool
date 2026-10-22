-- P4: NFC, Webhook (LINE), Live Copilot (รันต่อจาก 003)
create table nfc_cards (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  slug text unique not null, label text not null,
  target_url text, active boolean not null default true, scans int not null default 0,
  created_at timestamptz not null default now()
);
create table integrations (
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null, status text not null default 'connected',
  created_at timestamptz not null default now(),
  primary key (tenant_id, provider)
);
-- เก็บ secret แยกตาราง เปิด RLS โดยไม่มี policy = เฉพาะ service_role เท่านั้นที่เข้าถึงได้
create table integration_secrets (
  tenant_id uuid not null references tenants(id) on delete cascade,
  provider text not null, secret text not null,
  primary key (tenant_id, provider)
);
create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null, event_id text not null, tenant_id uuid,
  processed_at timestamptz not null default now(),
  unique (provider, event_id)
);
alter table conversations add column external_id text;
alter table conversations add constraint conv_ext unique (tenant_id, channel, external_id);
alter table nfc_cards enable row level security;
alter table integrations enable row level security;
alter table integration_secrets enable row level security;
alter table webhook_events enable row level security;
create policy nfc_member_all on nfc_cards for all using (is_member(tenant_id)) with check (is_member(tenant_id));
create policy integ_member_read on integrations for select using (is_member(tenant_id));

create function nfc_scan(p_slug text) returns text language plpgsql security definer set search_path = public as $$
declare tgt text; t uuid;
begin
  update nfc_cards set scans = scans + 1 where slug = p_slug and active returning target_url, tenant_id into tgt, t;
  if not found then return null; end if;
  if tgt is null or tgt = '' then select '/s/' || slug into tgt from tenants where id = t; end if;
  return tgt;
end $$;
revoke execute on function nfc_scan(text) from public, anon, authenticated;
grant execute on function nfc_scan(text) to service_role;
