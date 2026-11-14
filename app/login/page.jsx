import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthShell from "@/components/AuthShell";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

const ERRORS = {
  invalid: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  suspended: "บัญชีนี้ถูกระงับ กรุณาติดต่อแอดมิน",
};

export default async function LoginPage({ searchParams }) {
  const user = await getCurrentUser();
  if (user) redirect("/");
  const error = ERRORS[searchParams?.error];
  const canRegister = process.env.ALLOW_REGISTRATION !== "false";

  return (
    <AuthShell title="เข้าสู่ระบบ" subtitle="เทมเพลตปักตะกร้าของคุณเก็บไว้กับบัญชีนี้">
      <form className="glass" action={loginAction}>
        {error && <div className="alert" role="alert">{error}</div>}
        <label htmlFor="email">อีเมล
          <input id="email" name="email" type="email" required autoComplete="email" />
        </label>
        <label htmlFor="password">รหัสผ่าน
          <input id="password" name="password" type="password" required autoComplete="current-password" />
        </label>
        <button className="btn primary wide" type="submit">เข้าสู่ระบบ</button>
      </form>
      {canRegister && (
        <p className="stage-note">ยังไม่มีบัญชี? <Link href="/register">สมัครสมาชิก</Link></p>
      )}
    </AuthShell>
  );
}
