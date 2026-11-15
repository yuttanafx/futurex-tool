-- เทมเพลตปักตะกร้า TikTok: เก็บชื่อ ราคา แคปชัน แฮชแท็ก เลข อย. รายละเอียด ลิงก์ต้นทาง และลิงก์ตะกร้า TikTok ต่อร้าน (รันต่อจาก 015)
create table tiktok_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  price text not null default '',
  caption text not null default '',
  tags text not null default '',
  details text not null default '',
  fda_no text not null default '',
  source_url text not null default '',
  tiktok_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on tiktok_templates(tenant_id);
alter table tiktok_templates enable row level security;
create policy tiktok_templates_member_all on tiktok_templates for all using (is_member(tenant_id)) with check (is_member(tenant_id));
