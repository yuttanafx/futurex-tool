import { baht } from '@/lib/fmt'
// หน่วยชำระเงิน: thb = บาท (โอน/พร้อมเพย์), pv = แต้ม PV, wallet = วอลเล็ตของร้านในระบบ
export type Method = 'thb' | 'pv' | 'wallet'
export const METHODS: Method[] = ['thb', 'pv', 'wallet']
export const isMethod = (v: unknown): v is Method => typeof v === 'string' && (METHODS as string[]).includes(v)
export const METHOD_LABEL: Record<Method, string> = { thb: 'บาท (โอน/พร้อมเพย์)', pv: 'PV', wallet: 'วอลเล็ต' }
export const METHOD_SHORT: Record<Method, string> = { thb: 'บาท', pv: 'PV', wallet: 'วอลเล็ต' }
export const PLAN_IDS = ['free', 'starter', 'pro', 'business'] as const
export const MONTH_CHOICES = [1, 3, 6, 12]

export type Price = {
  code: string; kind: 'site' | 'user' | 'plan'; label: string
  price_thb: number; price_pv: number; price_wallet: number
  allow_thb: boolean; allow_pv: boolean; allow_wallet: boolean
  recommended: boolean; active: boolean; sort: number
}
export const normPrice = (r: any): Price => ({
  ...r, price_thb: Number(r.price_thb), price_pv: Number(r.price_pv), price_wallet: Number(r.price_wallet),
})
export const amountOf = (p: Price, m: Method) => (m === 'thb' ? p.price_thb : m === 'pv' ? p.price_pv : p.price_wallet)
export const allowed = (p: Price, m: Method) => (m === 'thb' ? p.allow_thb : m === 'pv' ? p.allow_pv : p.allow_wallet)
const num = (n: number) => new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 }).format(n)
export const fmtAmount = (n: number, m: Method) => (m === 'thb' ? baht(n) : `${num(n)} ${METHOD_SHORT[m]}`)

/** ข้อความราคาหลายหน่วย เช่น "฿990 · 990 PV · 900 วอลเล็ต" (เฉพาะหน่วยที่เปิดให้จ่าย) */
export function priceText(p: Price): string {
  const parts = METHODS.filter((m) => allowed(p, m)).map((m) => fmtAmount(amountOf(p, m), m))
  return parts.length ? parts.join(' · ') : '-'
}
/** วิธีจ่ายที่ใช้ได้กับทุกรายการที่ต้องจ่าย (ตัดสินใจจริงที่ฐานข้อมูลอีกครั้ง) */
export function commonMethods(items: Price[]): Method[] {
  return METHODS.filter((m) => items.every((p) => allowed(p, m)))
}
/** รายการที่ต้องคิดเงินสำหรับแพ็กเกจที่เลือก (ไม่รวมยูสเซอร์เพิ่ม ซึ่งนับที่ DB) */
export function itemsFor(prices: Price[], plan: string): Price[] {
  return prices.filter((p) => p.active && (p.code === 'site' || p.code === 'user' || p.code === `plan_${plan}`))
}

export const INVOICE_STATUS: Record<string, string> = { pending: 'รอตรวจสอบ', paid: 'ชำระแล้ว', rejected: 'ไม่อนุมัติ', cancelled: 'ยกเลิก' }
export const dt = (s?: string | null) => (s ? new Date(s).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: '2-digit' }) : '-')
export const dtm = (s?: string | null) => (s ? new Date(s).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-')
export const BILL_ERR: Record<string, string> = {
  invalid: 'ข้อมูลไม่ถูกต้อง', method_not_allowed: 'แพ็กเกจนี้ไม่เปิดให้จ่ายด้วยวิธีที่เลือก', 'nothing to pay': 'ไม่มียอดที่ต้องชำระ (แพ็กเกจฟรี)',
  'pending invoice exists': 'มีใบแจ้งหนี้ที่รอชำระ/รอตรวจสอบอยู่แล้ว ชำระหรือยกเลิกใบเดิมก่อน', forbidden: 'เฉพาะเจ้าของร้าน/แอดมินร้านเท่านั้น',
  'insufficient wallet': 'ยอดวอลเล็ตไม่พอ', 'insufficient pv': 'PV ไม่พอ', 'invalid amount': 'จำนวนเงินไม่ถูกต้อง', 'too many pending': 'มีรายการเติมเงินรออนุมัติหลายรายการแล้ว',
}
export const billErr = (m?: string) => { const k = Object.keys(BILL_ERR).find((x) => (m ?? '').includes(x)); return k ? BILL_ERR[k] : 'ดำเนินการไม่สำเร็จ ลองใหม่อีกครั้ง' }
