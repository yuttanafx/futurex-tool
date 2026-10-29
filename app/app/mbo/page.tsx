import { T } from '@/components/Prefs'
import MboFrame from './MboFrame'

const SRC = process.env.NEXT_PUBLIC_MBO_URL || 'https://mbo.futurex.today/Login.aspx'

export default function Mbo() {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          <T th="ล็อกอินระบบสมาชิก FutureX" en="FutureX Member Login" zh="FutureX 会员登录" />
        </h1>
        <a href={SRC} target="_blank" rel="noopener noreferrer" className="btn-ghost">
          <T th="เปิดในแท็บใหม่ ↗" en="Open in new tab ↗" zh="在新标签页打开 ↗" />
        </a>
      </div>
      <p className="mt-2 text-xs text-ink/60">
        <T
          th="ล็อกอินบัญชีสมาชิก FutureX ในกรอบนี้ได้เลย ถ้ากรอบว่างหรือเข้าไม่ได้ ให้กดปุ่มด้านบนกรอบเพื่อสลับเป็นรูป + ลิงก์"
          en="Log in with your FutureX member account right here. If the frame is blank or won't sign in, use the button above the frame to switch to image + link."
          zh="可直接在此框内登录 FutureX 会员账号。若框内空白或无法登录，请点框上方按钮切换为图片与链接。"
        />
      </p>
      <MboFrame src={SRC} />
    </>
  )
}
