import Link from "next/link";
import { logoutAction } from "@/app/actions";
import BrandMark from "./BrandMark";

export default function Header({ user }) {
  return (
    <header className="topbar">
      <div className="topbar-in">
        <Link href="/" className="brand">
          <BrandMark />
          เทมเพลตปักตะกร้า
        </Link>
        <nav className="nav" aria-label="เมนูหลัก">
          <Link href="/dashboard">เทมเพลตของฉัน</Link>
          {user.role === "admin" && <Link href="/admin">จัดการสมาชิก</Link>}
        </nav>
        <span className="who">{user.name}</span>
        <form action={logoutAction}>
          <button className="btn sm" type="submit">ออกจากระบบ</button>
        </form>
      </div>
    </header>
  );
}
