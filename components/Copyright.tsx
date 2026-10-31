import { T } from '@/components/Prefs'
export const OWNER = 'TERRAVOLTECO'
/** ลิขสิทธิ์เว็บไซต์ — ใช้ร่วมกันทุกหน้า */
export default function Copyright({ className = '' }: { className?: string }) {
  return (
    <p className={className}>© {new Date().getFullYear()} {OWNER} · <T th="สงวนลิขสิทธิ์" en="All rights reserved" zh="版权所有" /></p>
  )
}
