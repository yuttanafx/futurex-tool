import pg from "pg";
import bcrypt from "bcryptjs";

// ใช้ Postgres ผ่าน DATABASE_URL (Neon / Supabase / Vercel Postgres / อื่น ๆ)
// เก็บ pool และผลการสร้างตารางไว้ใน globalThis กันเปิดซ้ำตอน dev hot reload และตอน serverless เรียกซ้ำ

function getPool() {
  if (!globalThis.__basketPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("ยังไม่ได้ตั้ง DATABASE_URL (ดู .env.example)");
    const local = /localhost|127\.0\.0\.1/.test(url);
    globalThis.__basketPool = new pg.Pool({
      connectionString: url,
      max: 5,
      ssl: local ? false : { rejectUnauthorized: false },
    });
  }
  return globalThis.__basketPool;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS templates (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    price      TEXT NOT NULL DEFAULT '',
    caption    TEXT NOT NULL DEFAULT '',
    tags       TEXT NOT NULL DEFAULT '',
    details    TEXT NOT NULL DEFAULT '',
    fda_no     TEXT NOT NULL DEFAULT '',
    source_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);
  CREATE TABLE IF NOT EXISTS publish_jobs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER,
    provider    TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','done','failed')),
    external_id TEXT,
    error       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS idx_jobs_user ON publish_jobs(user_id);
`;

async function seedAdmin(pool) {
  const { rowCount } = await pool.query("SELECT 1 FROM users WHERE role = 'admin' LIMIT 1");
  if (rowCount) return;
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 8) {
    console.warn("[db] ยังไม่มีแอดมิน: ตั้ง ADMIN_EMAIL และ ADMIN_PASSWORD (อย่างน้อย 8 ตัว)");
    return;
  }
  const name = process.env.ADMIN_NAME || "แอดมิน";
  await pool.query(
    "INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, 'admin') ON CONFLICT (email) DO NOTHING",
    [email, name, await bcrypt.hash(password, 12)]
  );
  console.log("[db] สร้างแอดมินคนแรกแล้ว:", email);
}

function ready() {
  if (!globalThis.__basketReady) {
    const pool = getPool();
    globalThis.__basketReady = (async () => {
      await pool.query(SCHEMA);
      await seedAdmin(pool);
    })().catch((e) => {
      globalThis.__basketReady = null; // ให้ลองใหม่รอบหน้า
      throw e;
    });
  }
  return globalThis.__basketReady;
}

// คืน rows ทั้งหมด
export async function many(text, params = []) {
  await ready();
  const res = await getPool().query(text, params);
  return res.rows;
}

// คืน row แรก หรือ undefined
export async function one(text, params = []) {
  return (await many(text, params))[0];
}

// สำหรับ INSERT/UPDATE/DELETE
export async function run(text, params = []) {
  await ready();
  return getPool().query(text, params);
}
