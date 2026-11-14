// โหมดที่ 1 (ใช้ได้ทันที): ไม่ส่งอะไรออกไปเอง
// ผู้ใช้กดคัดลอกในหน้าเว็บ แล้ววางและเพิ่มสินค้าในแอป TikTok เอง
export const manualPublisher = {
  id: "manual",
  label: "คัดลอกแล้ววางเอง",
  available() {
    return true;
  },
  async publish() {
    const err = new Error("โหมดนี้ไม่ส่งอัตโนมัติ ใช้ปุ่มคัดลอกแทน");
    err.code = "MANUAL_MODE";
    throw err;
  },
};
