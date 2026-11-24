-- วิดีโอคู่มือการใช้งาน: แอดมินแพลตฟอร์มเพิ่ม/แก้/เรียง/ลบ ส่วนสมาชิกที่ล็อกอินดูได้ (รันต่อจาก 016; ต้องมี is_platform_admin จาก 010)
create table manual_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  video_url text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on manual_videos(sort_order, created_at);
alter table manual_videos enable row level security;
create policy manual_videos_read on manual_videos for select to authenticated using (true);
create policy manual_videos_admin_write on manual_videos for all to authenticated using (is_platform_admin()) with check (is_platform_admin());
