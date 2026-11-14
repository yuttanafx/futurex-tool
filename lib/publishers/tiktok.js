// โหมดที่ 2 (ยังไม่เปิดใช้): ช่องเสียบสำหรับส่งผ่าน TikTok API
//
// ยังไม่ได้เขียนการเรียก API จริง เพราะยังไม่ได้ยืนยันว่า TikTok เปิด API
// ให้โพสต์คลิปพร้อมแนบสินค้าจาก TikTok Shop หรือไม่ และต้องมีบัญชีนักพัฒนาที่ได้รับอนุมัติก่อน
//
// เมื่อพร้อม ให้ทำตามนี้:
//   1) ตรวจเอกสาร TikTok ว่า endpoint ไหนรองรับการแนบสินค้า และต้องขอสิทธิ์ (scope) อะไร
//   2) เพิ่มตาราง connections เก็บโทเคนของแต่ละสมาชิก (เข้ารหัสก่อนเก็บ) และหน้า "เชื่อมบัญชี TikTok" ใช้ OAuth
//   3) เขียนการเรียก API ใน publish() ด้านล่าง แล้วคืนค่า { externalId }
//   4) ตั้ง IMPLEMENTED = true, ใส่ TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET และ PUBLISH_MODE=tiktok

const IMPLEMENTED = false;

export const tiktokPublisher = {
  id: "tiktok",
  label: "ส่งผ่าน TikTok API",
  available() {
    return (
      IMPLEMENTED &&
      Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET)
    );
  },
  // eslint-disable-next-line no-unused-vars
  async publish(user, template) {
    const err = new Error("ยังไม่ได้เขียนส่วนเชื่อมต่อ TikTok API");
    err.code = "NOT_IMPLEMENTED";
    throw err;
  },
};
