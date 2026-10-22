-- P2: สินค้า ลูกค้า คำสั่งซื้อ (รันต่อจาก 001)
create table customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null, phone text, email text,
  created_at timestamptz not null default now()
);
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no bigint generated always as identity,
  tenant_id uuid not null references tenants(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  status text not null default 'new' check (status in ('new','confirmed','shipped','done','cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null, quantity int not null check (quantity > 0), unit_price numeric(12,2) not null
);
create index on customers(tenant_id);
create index on orders(tenant_id, created_at desc);
create index on order_items(order_id);
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
create policy customers_member_all on customers for all using (is_member(tenant_id)) with check (is_member(tenant_id));
create policy orders_member_all on orders for all using (is_member(tenant_id)) with check (is_member(tenant_id));
create policy items_member_all on order_items for all using (is_member(tenant_id)) with check (is_member(tenant_id));
create policy products_public_read on products for select using (status = 'active');

-- ลูกค้าสั่งซื้อจากหน้าร้านโดยไม่ต้องสมัคร: ราคาอ่านจาก DB เสมอ ไม่เชื่อค่าจากหน้าเว็บ
create function place_order(p_tenant uuid, p_product uuid, p_qty int, p_name text, p_phone text) returns bigint
language plpgsql security definer set search_path = public as $$
declare pr products; c uuid; o orders;
begin
  if p_qty < 1 or p_qty > 100 or length(coalesce(p_name,'')) < 1 then raise exception 'invalid input'; end if;
  select * into pr from products where id = p_product and tenant_id = p_tenant and status = 'active';
  if not found then raise exception 'product not found'; end if;
  insert into customers(tenant_id, name, phone) values (p_tenant, left(p_name,120), left(p_phone,30)) returning id into c;
  insert into orders(tenant_id, customer_id, total) values (p_tenant, c, pr.price * p_qty) returning * into o;
  insert into order_items(order_id, tenant_id, product_id, name, quantity, unit_price) values (o.id, p_tenant, pr.id, pr.name, p_qty, pr.price);
  return o.order_no;
end $$;
