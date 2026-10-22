-- อุดช่องโหว่ที่ชุดทดสอบข้าม Tenant ตรวจพบ: ห้ามแถวของร้านเรา อ้างอิงแถวของร้านอื่น (รันต่อจาก 005)
drop policy msg_member_staff_insert on messages;
create policy msg_member_staff_insert on messages for insert with check (
  is_member(tenant_id) and sender_type = 'staff'
  and exists (select 1 from conversations c where c.id = conversation_id and c.tenant_id = messages.tenant_id));

drop policy items_member_all on order_items;
create policy items_member_all on order_items for all using (is_member(tenant_id)) with check (
  is_member(tenant_id)
  and exists (select 1 from orders o where o.id = order_id and o.tenant_id = order_items.tenant_id)
  and (product_id is null or exists (select 1 from products p where p.id = product_id and p.tenant_id = order_items.tenant_id)));

drop policy orders_member_all on orders;
create policy orders_member_all on orders for all using (is_member(tenant_id)) with check (
  is_member(tenant_id)
  and (customer_id is null or exists (select 1 from customers c where c.id = customer_id and c.tenant_id = orders.tenant_id)));
