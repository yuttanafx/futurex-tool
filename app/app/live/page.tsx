import LiveBoard from './LiveBoard'
import HeyGenPanel from './HeyGenPanel'
export default function Live() {
  return (
    <>
      <h1 className="text-2xl font-bold">ผู้ช่วยไลฟ์สด</h1>
      <p className="mt-2 text-sm text-ink/70">เวอร์ชันแรก: คุณวางคอมเมนต์จากไลฟ์ ระบบจัดกลุ่มคำถามและร่างคำตอบจากข้อมูลสินค้าจริงให้ คุณเป็นคนพูดหรือกดส่งเอง ระบบไม่ส่งข้อความเข้าไลฟ์อัตโนมัติ แต่ละครั้งที่กดวิเคราะห์นับเป็น 1 ข้อความในโควตา AI</p>
      <div className="live-wide mt-2 grid gap-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="min-w-0"><LiveBoard /></div>
        <HeyGenPanel />
      </div>
    </>
  )
}
