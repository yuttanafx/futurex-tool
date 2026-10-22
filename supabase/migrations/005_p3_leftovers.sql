-- ส่วนที่ค้างจาก P3: rate limit, ส่งต่อเจ้าหน้าที่/Inbox, คลังคอนเทนต์ (รันต่อจาก 004)
create table rate_limits (
  key text not null, window_start timestamptz not null, hits int not null default 0,
  primary key (key, window_start)
);
alter table rate_limits enable row level security;
create function rate_hit(p_key text, p_limit int, p_window int) returns boolean language plpgsql security definer set search_path = public as $$
declare w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window) * p_window); n int;
begin
  insert into rate_limits(key, window_start, hits) values (p_key, w, 1)
    on conflict (key, window_start) do update set hits = rate_limits.hits + 1 returning hits into n;
  if random() < 0.02 then delete from rate_limits where window_start < now() - interval '1 day'; end if;
  return n <= p_limit;
end $$;
revoke execute on function rate_hit(text, int, int) from public, anon, authenticated;
grant execute on function rate_hit(text, int, int) to service_role;

alter table conversations add column needs_human boolean not null default false;
create policy conv_member_update on conversations for update using (is_member(tenant_id)) with check (is_member(tenant_id));
create policy msg_member_staff_insert on messages for insert with check (is_member(tenant_id) and sender_type = 'staff');

create table content_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  kind text not null, title text not null, body text not null,
  created_at timestamptz not null default now()
);
alter table content_items enable row level security;
create policy content_member_all on content_items for all using (is_member(tenant_id)) with check (is_member(tenant_id));
