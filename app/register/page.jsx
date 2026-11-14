import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import { registerAction } from "./actions";

export const dynamic = "force-dynamic";

const ERRORS = {
  invalid: "กรอกชื่อและอีเมลให้ถูกต้อง",
  short: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร",
  exists: "อีเมลนี้มีบัญชีอยู่แล้ว",
};

export default async function RegisterPage({ searchParams }) {
  if (process.env.ALLOW_REGISTRATION === "false") redirect("/login");
  const user = await getCurrentUser();
  if (user) redirect("/");
  const error = ERRORS[searchParams?.error];

  return (
    <AuthShell title="สมัครสมาชิก" subtitle="สร้างบัญชีเพื่อเก็บเทมเพลตสินค้าของคุณเอง">
      <form className="glass" action={registerAction}>
        {error && <div className="alert" role="alert">{error}</div>}
        <label htmlFor="name">ชื่อที่แสดง
          <input id="name" name="name" required maxLength={80} autoComplete="name" />
        </label>
        <label htmlFor="email">อีเมล
          <input id="email" name="email" type="email" required autoComplete="email" />
        </label>
        <label htmlFor="password">รหัสผ่าน (อย่างน้อย 8 ตัว)
          <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
        <button className="btn primary wide" type="submit">สมัครสมาชิก</button>
      </form>
      <p className="stage-note">มีบัญชีแล้ว? <Link href="/login">เข้าสู่ระบบ</Link></p>
    </AuthShell>
  );
}
