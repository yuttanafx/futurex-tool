import { many } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import Header from "@/components/Header";
import { getPublisher } from "@/lib/publishers";
import TemplateManager from "./TemplateManager";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const canSend = getPublisher().id !== "manual";
  const items = await many(
    "SELECT id, name, price, caption, tags, details, fda_no, source_url FROM templates WHERE user_id = $1 ORDER BY updated_at DESC, id DESC",
    [user.id]
  );

  return (
    <>
      <Header user={user} />
      <main className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">สวัสดี {user.name}</p>
            <h1>เทมเพลตของฉัน</h1>
            <p className="hero-sub">กดคัดลอกครั้งเดียว แล้วไปวางตอนโพสต์คลิปใน TikTok</p>
          </div>
          <div className="hero-stats">
            <span><b>{items.length}</b> สินค้า</span>
            <span><b>{items.filter((i) => i.fda_no).length}</b> ใส่เลข อย. แล้ว</span>
          </div>
        </section>
        <TemplateManager items={items} canSend={canSend} />
        <p className="note">
          {canSend
            ? "ปุ่ม \"ส่งไป TikTok\" ส่งผ่านบัญชีที่เชื่อมต่อไว้ ถ้าไม่สำเร็จให้ใช้ปุ่มคัดลอกแล้ววางในแอป TikTok เอง"
            : "หน้านี้ช่วยคัดลอกข้อความเท่านั้น การปักตะกร้าจริงต้องกดเพิ่มสินค้าในแอป TikTok เอง"}
        </p>
      </main>
    </>
  );
}
