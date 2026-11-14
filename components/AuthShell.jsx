import BrandMark from "./BrandMark";

// ตำแหน่งฟองคงที่ (ไม่สุ่ม) เพื่อให้เซิร์ฟเวอร์กับหน้าเว็บแสดงตรงกัน
// x = ตำแหน่งแนวนอน, s = ขนาด, t = เวลาลอน, dl = หน่วงเวลา (ติดลบ = เริ่มกลางทาง), sw = แกว่งซ้ายขวา
const BUBBLES = [
  { x: "5%", s: "22px", t: "15s", dl: "-3s", sw: "24px" },
  { x: "12%", s: "46px", t: "22s", dl: "-11s", sw: "-30px" },
  { x: "20%", s: "14px", t: "13s", dl: "-6s", sw: "18px" },
  { x: "29%", s: "30px", t: "19s", dl: "-1s", sw: "-22px" },
  { x: "37%", s: "64px", t: "27s", dl: "-16s", sw: "34px" },
  { x: "46%", s: "18px", t: "14s", dl: "-9s", sw: "-16px" },
  { x: "54%", s: "38px", t: "21s", dl: "-4s", sw: "28px" },
  { x: "62%", s: "12px", t: "12s", dl: "-7s", sw: "-12px" },
  { x: "70%", s: "52px", t: "25s", dl: "-14s", sw: "-36px" },
  { x: "78%", s: "26px", t: "17s", dl: "-2s", sw: "20px" },
  { x: "85%", s: "16px", t: "13s", dl: "-10s", sw: "-14px" },
  { x: "92%", s: "40px", t: "23s", dl: "-18s", sw: "26px" },
];

export default function AuthShell({ title, subtitle, children }) {
  return (
    <main className="stage">
      <div className="aurora" aria-hidden="true">
        <i className="a1" />
        <i className="a2" />
        <i className="a3" />
      </div>
      <div className="bubbles" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <span key={i} style={{ "--x": b.x, "--s": b.s, "--t": b.t, "--dl": b.dl, "--sw": b.sw }} />
        ))}
      </div>
      <div className="stage-in">
        <div className="stage-head">
          <BrandMark className="mark" />
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
    </main>
  );
}
