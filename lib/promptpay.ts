// สร้างข้อความ PromptPay QR (EMVCo / Thai QR Payment) · ไม่ต้องใช้ payment gateway
const tlv = (id: string, v: string) => id + String(v.length).padStart(2, '0') + v
function crc16(s: string) {
  let c = 0xffff
  for (let k = 0; k < s.length; k++) {
    c ^= s.charCodeAt(k) << 8
    for (let i = 0; i < 8; i++) c = c & 0x8000 ? ((c << 1) ^ 0x1021) & 0xffff : (c << 1) & 0xffff
  }
  return c.toString(16).toUpperCase().padStart(4, '0')
}
/** id = เบอร์โทร (0812345678) หรือเลขบัตรประชาชน/เลขผู้เสียภาษี 13 หลัก */
export function promptPayPayload(id: string, amount?: number) {
  const d = id.replace(/\D/g, '')
  const isId = d.length >= 13
  const target = isId ? d.slice(0, 13) : '0066' + d.replace(/^0/, '')
  const acct = tlv('00', 'A000000677010111') + tlv(isId ? '02' : '01', target)
  const dynamic = typeof amount === 'number' && amount > 0
  const body = tlv('00', '01') + tlv('01', dynamic ? '12' : '11') + tlv('29', acct) + tlv('53', '764')
    + (dynamic ? tlv('54', amount!.toFixed(2)) : '') + tlv('58', 'TH') + '6304'
  return body + crc16(body)
}
