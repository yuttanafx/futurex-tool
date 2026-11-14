import { many } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import Header from "@/components/Header";
import { getPublishStatus } from "@/lib/publishers";
import { createUser, toggleActive, toggleRole, resetPassword, deleteUser } from "./actions";

export const dynamic = "force-dynamic";

const MESSAGES = {
  invalid: ["err", "กรอกชื่อและอีเมลให้ถูกต้อง"],
  short: ["err", "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร"],
  exists: ["err", "อีเมลนี้มีบัญชีอยู่แล้ว"],
  created: ["ok", "สร้างบัญชีแล้ว"],
  reset: ["ok", "ตั้งรหัสผ่านใหม่แล้ว"],
};

function thaiDate(value) {
  const d = new Date(value);
  return d.toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminPage({ searchParams }) {
  const me = await requireAdmin();
  const users = await many(
    `SELECT u.id, u.email, u.name, u.role, u.active, u.created_at,
            (SELECT COUNT(*)::int FROM templates t WHERE t.user_id = u.id) AS templates
     FROM users u ORDER BY u.created_at DESC, u.id DESC`
  );

  const pub = getPublishStatus();
  const msg = MESSAGES[searchParams?.error] || MESSAGES[searchParams?.ok];
  const total = users.length;
  const admins = users.filter((u) => u.role === "admin").length;
  const suspended = users.filter((u) => !u.active).length;

  return (
    <>
      <Header user={me} />
      <main className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">แผงแอดมิน</p>
            <h1>จัดการสมาชิก</h1>
          </div>
          <div className="hero-stats">
            <span><b>{total}</b> ทั้งหมด</span>
            <span><b>{admins}</b> แอดมิน</span>
            <span><b>{suspended}</b> ถูกระงับ</span>
          </div>
        </section>

        <div className="card">
          <div className="row">
            <b>โหมดโพสต์</b>
            <span className={"pill " + (pub.active === "manual" ? "" : "ok")}>{pub.label}</span>
          </div>
          <p className="meta" style={{ margin: 0 }}>
            {pub.fellBack
              ? `ตั้งค่าเป็น "${pub.wanted}" แต่ยังไม่พร้อมใช้งาน ระบบจึงใช้โหมดคัดลอกแทน (ดูวิธีเปิดในไฟล์ lib/publishers/tiktok.js)`
              : pub.active === "manual"
              ? "สมาชิกกดคัดลอกแล้ววางและเพิ่มสินค้าในแอป TikTok เอง"
              : "สมาชิกเห็นปุ่ม \"ส่งไป TikTok\" ที่การ์ดสินค้า"}
          </p>
        </div>

        {msg && (
          <div className={msg[0] === "err" ? "alert" : "alert ok"} role="status">
            {msg[1]}
          </div>
        )}

        <details className="fold">
          <summary>เพิ่มสมาชิก</summary>
          <form className="body" action={createUser} autoComplete="off">
            <label htmlFor="n-name">ชื่อที่แสดง
              <input id="n-name" name="name" required maxLength={80} />
            </label>
            <label htmlFor="n-email">อีเมล
              <input id="n-email" name="email" type="email" required />
            </label>
            <label htmlFor="n-pass">รหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัว)
              <input id="n-pass" name="password" type="text" required minLength={8} autoComplete="off" />
            </label>
            <label htmlFor="n-role">บทบาท
              <select id="n-role" name="role" defaultValue="member">
                <option value="member">สมาชิก</option>
                <option value="admin">แอดมิน</option>
              </select>
            </label>
            <div className="row">
              <button className="btn primary" type="submit">สร้างบัญชี</button>
            </div>
          </form>
        </details>

        <ul className="list">
          {users.map((u) => {
            const self = u.id === me.id;
            return (
              <li className="card" key={u.id}>
                <div className="head">
                  <div style={{ minWidth: 0 }}>
                    <h2 className="name">{u.name}{self ? " (คุณ)" : ""}</h2>
                    <div className="meta">{u.email}</div>
                  </div>
                  <div className="row" style={{ justifyContent: "flex-end" }}>
                    <span className={"pill" + (u.role === "admin" ? " admin" : "")}>
                      {u.role === "admin" ? "แอดมิน" : "สมาชิก"}
                    </span>
                    <span className={"pill " + (u.active ? "ok" : "off")}>
                      {u.active ? "ใช้งานอยู่" : "ถูกระงับ"}
                    </span>
                  </div>
                </div>
                <div className="meta">
                  สมัครเมื่อ {thaiDate(u.created_at)} · เทมเพลต {u.templates} รายการ
                </div>

                <div className="row">
                  {!self && (
                    <>
                      <form action={toggleRole}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="btn sm" type="submit">
                          {u.role === "admin" ? "ลดเป็นสมาชิก" : "ตั้งเป็นแอดมิน"}
                        </button>
                      </form>
                      <form action={toggleActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="btn sm" type="submit">
                          {u.active ? "ระงับบัญชี" : "เปิดใช้งาน"}
                        </button>
                      </form>
                    </>
                  )}
                  <details className="inline">
                    <summary><span className="btn sm">ตั้งรหัสผ่านใหม่</span></summary>
                    <form className="row" action={resetPassword} style={{ marginTop: 8 }} autoComplete="off">
                      <input type="hidden" name="id" value={u.id} />
                      <input className="grow" name="password" type="text" required minLength={8}
                        placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)" aria-label={"รหัสผ่านใหม่ของ " + u.name} />
                      <button className="btn sm primary" type="submit">บันทึก</button>
                    </form>
                  </details>
                  {!self && (
                    <details className="inline">
                      <summary><span className="btn sm ghost">ลบบัญชี</span></summary>
                      <form className="row" action={deleteUser} style={{ marginTop: 8 }}>
                        <input type="hidden" name="id" value={u.id} />
                        <span className="meta">เทมเพลตของสมาชิกจะถูกลบด้วย</span>
                        <button className="btn sm danger" type="submit">ยืนยันลบ</button>
                      </form>
                    </details>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
