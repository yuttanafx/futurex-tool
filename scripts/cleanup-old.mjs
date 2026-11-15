// ลบไฟล์ของโปรเจกต์เก่า (เทมเพลตปักตะกร้า) ที่ค้างปนอยู่ใน repo นี้ · ไม่ใช้ใน FutureX และทำให้ build ล้ม (ต้องการ pg / bcryptjs)
// ดูก่อนว่าจะลบอะไร: node scripts/cleanup-old.mjs        ลบจริง: node scripts/cleanup-old.mjs --yes
// รันอัตโนมัติก่อน next build ผ่าน "prebuild" ใน package.json (ลบเฉพาะรายการด้านล่างเท่านั้น ไม่แตะไฟล์อื่น)
import { existsSync, rmSync, statSync } from 'node:fs'
const OLD = [
  'next.config.js', 'jsconfig.json', 'middleware.js', 'package-lock.json', 'tsconfig.tsbuildinfo',
  'scripts/seed-products.mjs',
  'app/actions.js', 'app/layout.jsx', 'app/page.jsx',
  'app/admin/actions.js', 'app/admin/page.jsx',
  'app/login/actions.js', 'app/login/page.jsx',
  'app/register/actions.js', 'app/register/page.jsx',
  'components/AuthShell.jsx', 'components/BrandMark.jsx', 'components/Header.jsx',
  'lib/auth.js', 'lib/db.js', 'lib/token.js',
  'app/dashboard', 'lib/publishers',
]
const yes = process.argv.includes('--yes')
const found = OLD.filter((p) => existsSync(p))
if (!found.length) { console.log('ไม่มีไฟล์เก่าค้างอยู่'); process.exit(0) }
for (const p of found) {
  console.log((yes ? 'ลบ  ' : 'จะลบ ') + p + (statSync(p).isDirectory() ? '/' : ''))
  if (yes) rmSync(p, { recursive: true, force: true })
}
if (!yes) console.log('\nรันซ้ำพร้อม --yes เพื่อลบจริง')
