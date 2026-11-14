// ส่วนนี้ใช้ได้ใน middleware (Edge) จึงห้าม import bcrypt หรือฐานข้อมูล
import { SignJWT, jwtVerify } from "jose";

export const COOKIE = "session";
export const MAX_AGE = 60 * 60 * 24 * 14; // 14 วัน

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(key());
}

export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, key());
    return payload;
  } catch {
    return null;
  }
}
