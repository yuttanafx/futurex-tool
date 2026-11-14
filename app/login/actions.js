"use server";

import { redirect } from "next/navigation";
import { one } from "@/lib/db";
import { checkPassword, createSession } from "@/lib/auth";

export async function loginAction(formData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const user = await one("SELECT * FROM users WHERE email = $1", [email]);
  const ok = await checkPassword(password, user?.password_hash);

  if (!user || !ok) redirect("/login?error=invalid");
  if (!user.active) redirect("/login?error=suspended");

  await createSession(user);
  redirect(user.role === "admin" ? "/admin" : "/dashboard");
}
