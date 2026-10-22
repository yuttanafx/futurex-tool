-- รายละเอียดสินค้า: คำอธิบายและรูป (ลิงก์รูป) สำหรับหน้าสินค้า /s/{slug}/products/{id}
alter table products add column description text, add column image_url text;
notify pgrst, 'reload schema';
