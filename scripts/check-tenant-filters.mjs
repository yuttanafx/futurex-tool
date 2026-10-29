// ตัวตรวจแบบสแตติก: ตาราง tenants / products / sales_pages เปิดอ่านสาธารณะ (เพื่อหน้าร้าน) ดังนั้นโค้ดฝั่งแดชบอร์ดที่ query ตารางเหล่านี้
// ต้องกรอง tenant เอง (.eq('tenant_id', …) หรือ .eq('id', tenant.id)) ไม่งั้นสมาชิกจะเห็นข้อมูลร้านอื่น · รัน: npm run check:tenant
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
const PUBLIC = ['products', 'sales_pages', 'tenants']
const DIRS = ['app/app', 'app/admin', 'components']
const files = []
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) && files.push(p) } }
for (const d of DIRS) { try { walk(d) } catch {} }
let bad = 0
// ขอบเขตของคำสั่ง: เริ่มที่ .from(...) แล้วอ่านต่อจนวงเล็บสมดุล และบรรทัดถัดไปไม่ใช่ chain ที่ขึ้นต้นด้วย "."
function statement(lines, i, col) {
  let t = lines[i].slice(col), j = i
  const depth = (x) => (x.match(/\(/g) || []).length - (x.match(/\)/g) || []).length
  for (;;) {
    const chained = j + 1 < lines.length && /^\s*\./.test(lines[j + 1])
    if (depth(t) <= 0 && !chained) break
    if (++j >= lines.length) break
    t += '\n' + lines[j]
  }
  return t
}
for (const f of files) {
  const lines = readFileSync(f, 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const m of line.matchAll(new RegExp(`\\.from\\((['"])(${PUBLIC.join('|')})\\1\\)`, 'g'))) {
      const st = statement(lines, i, m.index)
      if (/\)\s*\.insert\(/.test(st.slice(0, 40))) continue // insert ใส่ tenant_id ในข้อมูลเอง (RLS with check ตรวจซ้ำ)
      if (!/tenant_id|\.eq\((['"])id\1,\s*tenant\.id\)/.test(st)) { bad++; console.log(`FAIL ${f}:${i + 1}  query ${m[2]} ไม่มีตัวกรอง tenant`) }
    }
  })
}
console.log(bad ? `\nพบ ${bad} จุดที่เสี่ยงข้อมูลข้ามร้าน` : 'ผ่าน: query ตารางสาธารณะในแดชบอร์ดกรอง tenant ครบ')
process.exit(bad ? 1 : 0)
