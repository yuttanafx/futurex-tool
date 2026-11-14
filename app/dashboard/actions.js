"use server";

import { revalidatePath } from "next/cache";
import { one, run } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getPublisher } from "@/lib/publishers";

const clean = (v, max) => String(v ?? "").trim().slice(0, max);

// ทุกคำสั่งผูกกับ user_id ของคนที่ล็อกอิน สมาชิกจึงแก้ของคนอื่นไม่ได้
export async function saveTemplate(formData) {
  const user = await requireUser();
  const id = Number(formData.get("id") || 0);
  const name = clean(formData.get("name"), 120);
  const price = clean(formData.get("price"), 9).replace(/[^0-9]/g, "");
  const caption = clean(formData.get("caption"), 2000);
  const tags = clean(formData.get("tags"), 300);
  const details = clean(formData.get("details"), 3000);
  const fda = clean(formData.get("fda_no"), 40);
  let source = clean(formData.get("source_url"), 500);
  if (!/^https?:\/\//i.test(source)) source = ""; // รับเฉพาะลิงก์ http/https
  if (!name) return;

  if (id) {
    await run(
      `UPDATE templates SET name = $1, price = $2, caption = $3, tags = $4, details = $5, fda_no = $6, source_url = $7,
         updated_at = now()
       WHERE id = $8 AND user_id = $9`,
      [name, price, caption, tags, details, fda, source, id, user.id]
    );
  } else {
    await run(
      `INSERT INTO templates (user_id, name, price, caption, tags, details, fda_no, source_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [user.id, name, price, caption, tags, details, fda, source]
    );
  }
  revalidatePath("/dashboard");
}

// โหมดที่ 2: ส่งผ่าน API ใช้ได้เมื่อ getPublisher() ไม่ใช่ manual เท่านั้น
export async function sendTemplate(id) {
  const user = await requireUser();
  const publisher = getPublisher();
  if (publisher.id === "manual") {
    return { ok: false, message: "ยังไม่เปิดโหมดส่งไป TikTok ใช้ปุ่มคัดลอกแทน" };
  }
  const t = await one(
    "SELECT id, name, price, caption, tags FROM templates WHERE id = $1 AND user_id = $2",
    [Number(id), user.id]
  );
  if (!t) return { ok: false, message: "ไม่พบสินค้า" };

  const job = await one(
    "INSERT INTO publish_jobs (user_id, template_id, provider) VALUES ($1, $2, $3) RETURNING id",
    [user.id, t.id, publisher.id]
  );
  const jobId = job.id;
  try {
    const r = await publisher.publish(user, t);
    await run("UPDATE publish_jobs SET status = 'done', external_id = $1 WHERE id = $2", [
      r?.externalId ? String(r.externalId) : null,
      jobId,
    ]);
    return { ok: true, message: "ส่งแล้ว" };
  } catch (e) {
    await run("UPDATE publish_jobs SET status = 'failed', error = $1 WHERE id = $2", [
      String(e?.message || e).slice(0, 500),
      jobId,
    ]);
    return { ok: false, message: "ส่งไม่สำเร็จ: " + (e?.message || "ไม่ทราบสาเหตุ") };
  }
}

export async function deleteTemplate(id) {
  const user = await requireUser();
  await run("DELETE FROM templates WHERE id = $1 AND user_id = $2", [Number(id), user.id]);
  revalidatePath("/dashboard");
}
