import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { one } from "./db";
import { COOKIE, MAX_AGE, signToken, verifyToken } from "./token";

export const hashPassword = (plain) => bcrypt.hash(plain, 12);

let dummyHash;
// เทียบรหัสผ่านเสมอแม้ไม่พบอีเมล เพื่อไม่ให้เดาได้จากเวลาตอบกลับ
export async function checkPassword(plain, hash) {
  if (!hash) {
    dummyHash ??= bcrypt.hashSync("dummy-password", 12);
    await bcrypt.compare(plain, dummyHash);
    return false;
  }
  return bcrypt.compare(plain, hash);
}

export async function createSession(user) {
  const token = await signToken({ uid: user.id, role: user.role });
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

// อ่านผู้ใช้จากฐานข้อมูลทุกครั้ง เพื่อให้การระงับบัญชี/เปลี่ยนบทบาทมีผลทันที
export async function getCurrentUser() {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await one(
    "SELECT id, email, name, role, active FROM users WHERE id = $1",
    [payload.uid]
  );
  if (!user || !user.active) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
