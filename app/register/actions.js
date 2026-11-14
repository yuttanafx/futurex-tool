"use server";

import { redirect } from "next/navigation";
import { one } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function registerAction(formData) {
  if (process.env.ALLOW_REGISTRATION === "false") redirect("/login");

  const name = String(formData.get("name") || "").trim().slice(0, 80);
  const email = String(formData.get("email") || "").trim().toLowerCase().slice(0, 200);
  const password = String(formData.get("password") || "");

  if (!name || !EMAIL_RE.test(email)) redirect("/register?error=invalid");
  if (password.length < 8) redirect("/register?error=short");

  if (await one("SELECT 1 FROM users WHERE email = $1", [email])) {
    redirect("/register?error=exists");
  }

  const hash = await hashPassword(password);
  let created;
  try {
    created = await one(
      "INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, 'member') RETURNING id",
      [email, name, hash]
    );
  } catch (e) {
    if (e?.code === "23505") redirect("/register?error=exists"); // อีเมลซ้ำพอดีกัน
    throw e;
  }

  await createSession({ id: created.id, role: "member" });
  redirect("/dashboard");
}
