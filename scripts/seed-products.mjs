// ใส่สินค้าจากร้าน "ร้านของฉัน" (FutureX) ลงเทมเพลตของสมาชิกที่ระบุ
// ใช้: npm run seed:products -- อีเมลสมาชิก
// ต้องตั้ง DATABASE_URL ใน .env.local และมีบัญชีนี้ในระบบก่อน (สมัครผ่านเว็บก่อน)
//
// รายละเอียดเก็บเฉพาะข้อเท็จจริงจากหน้าสินค้า (ส่วนผสม ขนาด วิธีทาน) ไม่เอาข้อความสรรพคุณ
// หมายเหตุ: รหัสสินค้าในหน้าร้านเป็น SAMPLE-01 ถึง SAMPLE-07 อาจเป็นข้อมูลตัวอย่าง ควรเทียบกับฉลากจริงก่อนใช้
import pg from "pg";

const email = (process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("ใช้: npm run seed:products -- อีเมลสมาชิก");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("ยังไม่ได้ตั้ง DATABASE_URL ใน .env.local");
  process.exit(1);
}
const local = /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL);
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: local ? false : { rejectUnauthorized: false },
});
await db.connect();

const {
  rows: [user],
} = await db.query("SELECT id FROM users WHERE email = $1", [email]);
if (!user) {
  console.error("ไม่พบบัญชีนี้ในระบบ: " + email);
  await db.end();
  process.exit(1);
}

const BASE =
  "https://www.futurex-tool.online/s/%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%99%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%89%E0%B8%B1%E0%B8%99-pm2l/products/";
const cta = "กดตะกร้าสีส้มใต้คลิปเพื่อดูรายละเอียดและสั่งซื้อได้เลย";
const usePack = "วิธีทาน: ฉีกซองทานได้เลย หรือผสม 1 ซอง (3 กรัม) กับน้ำ 100 มล. วันละ 1–2 ซอง";
const usePowder = "วิธีทาน: ผง 1 สกู๊ป (ประมาณ 3–4 ช้อนโต๊ะ) ผสมน้ำ 250–300 มล. วันละ 1–2 มื้อ";

const products = [
  {
    id: "40ada819-9bc2-403d-ba2f-62f8b3ecd6a6",
    name: "PROM PORM Candy Detox (พรอม พอร์ม แคนดี้ ดีท็อกซ์)",
    price: "590",
    caption: `พรอม พอร์ม แคนดี้ ดีท็อกซ์ ราคา ฿590 (ปกติ ฿690)\n${cta}`,
    tags: "#อาหารเสริม #พรอมพอร์ม #tiktokshop #ปักตะกร้า",
    details: [
      "รูปแบบ: ลูกอม (อาหารเสริม)",
      "ส่วนผสมหลัก: NUTRIOSE® (ไฟเบอร์ละลายน้ำ), อิโปรน่า เลมอน, ใบบัว, เมล็ดชุมเห็ด, อินูลิน, วิตามินซี",
      "ขนาดบรรจุ: หน้าร้านไม่ระบุ",
      "วิธีทาน: 1–2 เม็ดต่อวัน ควรทานก่อนนอน",
    ].join("\n"),
  },
  {
    id: "d4c9d415-8350-4b0e-aed5-b065c1ace5c8",
    name: "YANEA NMN + คอลลาเจน (กล่องใหญ่ 30 ซอง)",
    price: "2300",
    caption: `YANEA NMN + คอลลาเจน กล่องใหญ่ 30 ซอง ฿2,300\n${cta}`,
    tags: "#yanea #คอลลาเจน #อาหารเสริม #tiktokshop #ปักตะกร้า",
    details: [
      "ขนาดบรรจุ: 30 ซอง (ซองละ 3 กรัม)",
      "ส่วนประกอบสำคัญ: Uthever® NMN, Collagen Optima®, แบล็กเคอร์แรนต์ (IPRONA), เห็ดหิมะ, สารสกัดเมล็ดองุ่น, อะเซโรลาเชอร์รี่, สารสกัดเปลือกสน, แอสตาแซนธิน",
      usePack,
    ].join("\n"),
  },
  {
    id: "21f7c9cf-3215-4e8a-ac5d-df3ffef07059",
    name: "YANEA NMN + คอลลาเจน (กล่องพกพา 10 ซอง)",
    price: "890",
    caption: `YANEA NMN + คอลลาเจน กล่องพกพา 10 ซอง ฿890 ลองก่อนได้ พกง่าย\n${cta}`,
    tags: "#yanea #คอลลาเจน #อาหารเสริม #tiktokshop #ปักตะกร้า",
    details: [
      "ขนาดบรรจุ: 10 ซอง (ซองละ 3 กรัม)",
      "ส่วนประกอบ: Uthever® NMN, Collagen Optima® (หน้าร้านระบุว่าสูตรเดียวกับกล่องใหญ่ แต่ไม่มีรายการส่วนผสมครบ)",
      usePack,
    ].join("\n"),
  },
  {
    id: "5a8b5d2e-54fe-41c8-a029-2b052f277402",
    name: "MATCHA, PSP, CELONYA โปรตีนธัญพืช 43 ชนิด (700 กรัม)",
    price: "1290",
    caption: `โปรตีนธัญพืช 43 ชนิด ขนาด 700 กรัม ฿1,290\n${cta}`,
    tags: "#โปรตีนธัญพืช #เครื่องดื่มเพื่อสุขภาพ #tiktokshop #ปักตะกร้า",
    details: [
      "ขนาดบรรจุ: 700 กรัม (หน้าร้านมีขนาด 900 กรัม และแบบซองให้เลือกด้วย)",
      "ส่วนประกอบ: มันเทศ ถั่วแดง ข้าวกล้อง เวย์ โอ๊ต บาร์เลย์ ถั่วเหลือง ควินัว ฟักทอง (พืชและธัญพืชกว่า 43 ชนิด)",
      usePowder,
    ].join("\n"),
  },
  {
    id: "f0268aaa-ed29-45e4-9f31-419f064fc2ab",
    name: "Happy Grain (แฮปปี้เกรน) เครื่องดื่มธัญพืช",
    price: "790",
    caption: `Happy Grain เครื่องดื่มธัญพืช ฿790\n${cta}`,
    tags: "#แฮปปี้เกรน #เครื่องดื่มธัญพืช #tiktokshop #ปักตะกร้า",
    details: [
      "ขนาดบรรจุ: มี 2 ขนาด (หน้าร้านไม่ระบุปริมาณ)",
      "ส่วนประกอบ: หน้าร้านไม่ระบุ (บอกแค่ว่าเป็นเครื่องดื่มธัญพืชรวม)",
      "วิธีทาน: 1 สกู๊ป (3–4 ช้อนโต๊ะ) กับน้ำ 250–300 มล. วันละ 1–2 มื้อ",
    ].join("\n"),
  },
  {
    id: "e9449a46-f64b-4efd-80e6-64f71d062013",
    name: "SANEA (ซาเนีย) สมดุลผู้หญิง (กล่องใหญ่ 30 ซอง)",
    price: "2300",
    caption: `SANEA ซาเนีย กล่องใหญ่ 30 ซอง ฿2,300\n${cta}`,
    tags: "#sanea #ซาเนีย #อาหารเสริม #tiktokshop #ปักตะกร้า",
    details: [
      "ขนาดบรรจุ: 30 ซอง (ซองละ 3 กรัม)",
      "ส่วนประกอบสำคัญ: Estrogy-100®, คาซิป ฟาติมาห์, มัญจากานี, กวาวเครือขาว, บีทรูท, ไลโคปีน",
      usePack,
    ].join("\n"),
  },
  {
    id: "f0fda93a-8f33-471f-a2d3-e09376e0e586",
    name: "SANEA (ซาเนีย) สมดุลผู้หญิง (กล่องพกพา 10 ซอง)",
    price: "890",
    caption: `SANEA ซาเนีย กล่องพกพา 10 ซอง ฿890 ลองก่อนได้ พกง่าย\n${cta}`,
    tags: "#sanea #ซาเนีย #อาหารเสริม #tiktokshop #ปักตะกร้า",
    details: [
      "ขนาดบรรจุ: 10 ซอง (ซองละ 3 กรัม)",
      "ส่วนประกอบ: หน้าร้านไม่ระบุ (บอกว่าสูตรเดียวกับกล่องใหญ่)",
      usePack,
    ].join("\n"),
  },
];

let added = 0;
let filled = 0;
for (const p of products.slice().reverse()) {
  const url = BASE + p.id;
  const {
    rows: [row],
  } = await db.query("SELECT id, details FROM templates WHERE user_id = $1 AND name = $2", [user.id, p.name]);
  if (!row) {
    await db.query(
      `INSERT INTO templates (user_id, name, price, caption, tags, details, source_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, p.name, p.price, p.caption, p.tags, p.details, url]
    );
    added++;
  } else if (!row.details) {
    await db.query("UPDATE templates SET details = $1, source_url = $2 WHERE id = $3 AND details = ''", [
      p.details,
      url,
      row.id,
    ]); // เติมรายละเอียดให้รายการที่เคยใส่ไว้ก่อนหน้า
    filled++;
  }
}
console.log(`เพิ่มใหม่ ${added} รายการ, เติมรายละเอียด ${filled} รายการ, ข้าม ${products.length - added - filled} รายการ`);
await db.end();
