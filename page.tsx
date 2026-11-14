import { redirect } from 'next/navigation'

// ย้ายฟอร์มตั้งค่ามารวมในหน้า ผู้ช่วย AI แล้ว
export default function AISettings() {
  redirect('/app/ai')
}
