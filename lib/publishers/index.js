import { manualPublisher } from "./manual";
import { tiktokPublisher } from "./tiktok";

const all = { manual: manualPublisher, tiktok: tiktokPublisher };

// เลือกโหมดจาก PUBLISH_MODE ถ้าโหมดนั้นยังไม่พร้อม (ไม่มีคีย์ หรือยังไม่ได้เขียน) จะถอยกลับไปโหมดคัดลอกเสมอ
export function getPublisher() {
  const wanted = (process.env.PUBLISH_MODE || "manual").trim().toLowerCase();
  const p = all[wanted];
  return p && p.available() ? p : manualPublisher;
}

export function getPublishStatus() {
  const wanted = (process.env.PUBLISH_MODE || "manual").trim().toLowerCase();
  const active = getPublisher();
  return { wanted, active: active.id, label: active.label, fellBack: wanted !== active.id };
}
