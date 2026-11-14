"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { one, run } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userId = (fd) => Number(fd.get("id") || 0);

export async function createUser(formData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim().slice(0, 80);
  const email = String(formData.get("email") || "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") || "");
  const role = formData.get("role") === "admin" ? "admin" : "member";

  if (!name || !EMAIL_RE.test(email)) redirect("/admin?error=invalid");
  if (password.length < 8) redirect("/admin?error=short");

  if (await one("SELECT 1 FROM users WHERE email = $1", [email])) redirect("/admin?error=exists");
  await run("INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)", [
    email, name, await hashPassword(password), role,
  ]);
  revalidatePath("/admin");
  redirect("/admin?ok=created");
}

// ห้ามแอดมินแก้สถานะ/บทบาท/ลบบัญชีตัวเอง กันระบบไม่เหลือแอดมิน
export async function toggleActive(formData) {
  const admin = await requireAdmin();
  const id = userId(formData);
  if (!id || id === admin.id) return;
  await run("UPDATE users SET active = 1 - active WHERE id = $1", [id]);
  revalidatePath("/admin");
}

export async function toggleRole(formData) {
  const admin = await requireAdmin();
  const id = userId(formData);
  if (!id || id === admin.id) return;
  await run("UPDATE users SET role = CASE role WHEN 'admin' THEN 'member' ELSE 'admin' END WHERE id = $1", [id]);
  revalidatePath("/admin");
}

export async function resetPassword(formData) {
  await requireAdmin();
  const id = userId(formData);
  const password = String(formData.get("password") || "");
  if (!id) return;
  if (password.length < 8) redirect("/admin?error=short");
  await run("UPDATE users SET password_hash = $1 WHERE id = $2", [await hashPassword(password), id]);
  redirect("/admin?ok=reset");
}

export async function deleteUser(formData) {
  const admin = await requireAdmin();
  const id = userId(formData);
  if (!id || id === admin.id) return;
  await run("DELETE FROM users WHERE id = $1", [id]); // เทมเพลตของสมาชิกถูกลบตามอัตโนมัติ
  revalidatePath("/admin");
}
