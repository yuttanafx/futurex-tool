'use client'
import { useEffect, useRef } from 'react'
import { usePrefs } from './Prefs'
import type { Lang } from '@/lib/i18n'

/* พื้นหลังอนิเมชันธีมการตลาด: กราฟยอดขายเลื่อน, ไอคอนการตลาดลอยขึ้น,
   เครือข่ายลูกค้า, ป้ายแจ้งเตือน (เปลี่ยนตามภาษา), ดวงอาทิตย์/ดวงจันทร์ (เปลี่ยนตามโหมด) */

type RGB = [number, number, number]
// [กลางคืน, กลางวัน]
const PAL: Record<string, [RGB, RGB]> = {
  skyTop: [[7, 12, 32], [186, 219, 255]],
  skyBot: [[16, 30, 70], [247, 251, 255]],
  glowA: [[59, 91, 255], [255, 207, 112]],
  glowB: [[14, 124, 102], [112, 192, 255]],
  accent: [[124, 162, 255], [47, 91, 255]],
  accent2: [[52, 211, 153], [8, 145, 110]],
  warm: [[255, 196, 96], [236, 130, 30]],
  ink: [[226, 232, 255], [18, 48, 61]],
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const col = (k: string, m: number): RGB => {
  const [n, d] = PAL[k]
  return [lerp(n[0], d[0], m), lerp(n[1], d[1], m), lerp(n[2], d[2], m)]
}
const rgba = (v: RGB | number[], a: number) => `rgba(${v[0] | 0},${v[1] | 0},${v[2] | 0},${a})`
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

const MSG: Record<Lang, string[]> = {
  th: ['ออเดอร์ใหม่ +1', 'ลูกค้าใหม่เข้ามา', 'AI ตอบแชทแล้ว', 'แคมเปญเริ่มทำงาน', 'กู้ตะกร้าสำเร็จ', 'มีคนกดลิงก์แนะนำ', 'รีวิว 5 ดาวใหม่'],
  en: ['New order +1', 'New lead captured', 'AI replied to chat', 'Campaign is live', 'Cart recovered', 'Referral link clicked', 'New 5-star review'],
  zh: ['新订单 +1', '新线索已捕获', 'AI 已回复聊天', '活动已上线', '购物车已挽回', '推荐链接被点击', '新增 5 星好评'],
}
const SALES: Record<Lang, string> = { th: 'ยอดขาย', en: 'Sales', zh: '销售额' }

// ไอคอนเส้น 24x24: ตะกร้า, ลำโพงโฆษณา, แชท, หัวใจ, แท็กราคา, กระดิ่ง, กราฟขึ้น, เหรียญ, กรวยการขาย, ดาว, เป้าหมาย, อีเมล
const ICON_D = [
  'M3 3h3l2.6 12.4a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L21 7H6.2 M8.6 20.5a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0 M16.6 20.5a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0-2.4 0',
  'M3 10v4a1 1 0 0 0 1 1h2.5l7.5 4V5L6.5 9H4a1 1 0 0 0-1 1z M17.5 9.5a4 4 0 0 1 0 5 M20 7a7.5 7.5 0 0 1 0 10',
  'M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M7 9h10 M7 12.5h6',
  'M12 20.5s-8-4.9-8-11A4.6 4.6 0 0 1 12 6.8 4.6 4.6 0 0 1 20 9.5c0 6.1-8 11-8 11z',
  'M3 3h8.2l9.8 9.8a1.4 1.4 0 0 1 0 2L15 21a1.4 1.4 0 0 1-2 0L3 11.2z M7.5 7.5h.01',
  'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.8 2H4.2z M10 21.5h4',
  'M3 17l6-6 4 4 8-8 M15 7h6v6',
  'M12 3a9 9 0 1 0 .01 0z M12 7v10 M14.8 9.2c-.6-.9-1.6-1.3-2.8-1.3-1.7 0-2.8.9-2.8 2.1 0 3 5.8 1.6 5.8 4.6 0 1.2-1.1 2.2-3 2.2-1.3 0-2.4-.5-3-1.5',
  'M3 4h18l-7 8.5V19l-4 2v-8.5z',
  'M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.3l1-6.2L3 9.7l6.2-.9z',
  'M12 3a9 9 0 1 0 .01 0z M12 8a4 4 0 1 0 .01 0z M12 12h.01',
  'M3 6h18v12H3z M3 7l9 7 9-7',
]
const ICON_COLORS = ['accent', 'accent2', 'warm']

interface Star { x: number; y: number; r: number; ph: number; sp: number }
interface Cloud { x: number; y: number; s: number; v: number }
interface Node { x: number; y: number; vx: number; vy: number }
interface Icon { k: number; x: number; y: number; size: number; sp: number; sway: number; ph: number; rot: number; rs: number; a: number; ci: number }
interface Chip { x: number; y: number; age: number; life: number; key: number; vy: number }

export default function MarketingBackground() {
  const ref = useRef<HTMLCanvasElement>(null)
  const { lang, theme } = usePrefs()
  const langRef = useRef<Lang>(lang)
  const themeRef = useRef(theme)
  const kick = useRef<() => void>(() => {})

  useEffect(() => {
    langRef.current = lang
    themeRef.current = theme
    kick.current()
  }, [lang, theme])

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const c2d = cv.getContext('2d')
    if (!c2d) return
    const ctx: CanvasRenderingContext2D = c2d

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduce = mq.matches
    let w = 0, h = 0, dpr = 1, raf = 0
    let t = reduce ? 7 : 0
    let m = themeRef.current === 'day' ? 1 : 0
    let fam = getComputedStyle(document.body).fontFamily
    let pxm = -1, pym = -1, mouseOn = false, mx = 0, my = 0
    let chipTimer = 0.6

    const paths = ICON_D.map((d) => new Path2D(d))
    let stars: Star[] = [], clouds: Cloud[] = [], nodes: Node[] = [], icons: Icon[] = [], chips: Chip[] = []

    const newIcon = (initial: boolean): Icon => ({
      k: Math.floor(Math.random() * paths.length),
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 40 + Math.random() * 80,
      size: 24 + Math.random() * 26,
      sp: 10 + Math.random() * 22,
      sway: 12 + Math.random() * 26,
      ph: Math.random() * 6.28,
      rot: (Math.random() - 0.5) * 0.6,
      rs: (Math.random() - 0.5) * 0.3,
      a: 0.16 + Math.random() * 0.26,
      ci: Math.floor(Math.random() * ICON_COLORS.length),
    })

    const init = () => {
      const area = w * h
      const small = w < 640
      stars = Array.from({ length: Math.min(150, Math.floor(area / 9000)) }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.7, r: 0.5 + Math.random() * 1.3, ph: Math.random() * 6.28, sp: 0.8 + Math.random() * 1.8,
      }))
      clouds = Array.from({ length: small ? 3 : 6 }, () => ({
        x: Math.random() * w, y: h * (0.06 + Math.random() * 0.42), s: 0.6 + Math.random() * 0.9, v: 5 + Math.random() * 10,
      }))
      nodes = Array.from({ length: small ? 18 : 38 }, () => ({
        x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 22, vy: (Math.random() - 0.5) * 22,
      }))
      const nIcons = small ? 9 : Math.min(20, Math.max(10, Math.floor(area / 70000)))
      icons = Array.from({ length: nIcons }, () => newIcon(true))
      chips = []
    }

    const resize = () => {
      const nw = window.innerWidth, nh = window.innerHeight
      const reinit = nw !== w || Math.abs(nh - h) > 150
      w = nw; h = nh
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(h * dpr)
      if (reinit) init()
      if (reduce) draw()
    }

    // ---------- helpers ----------
    const rr = (x: number, y: number, rw: number, rh: number, r: number) => {
      const k = Math.min(r, rw / 2, rh / 2)
      ctx.beginPath()
      ctx.moveTo(x + k, y)
      ctx.arcTo(x + rw, y, x + rw, y + rh, k)
      ctx.arcTo(x + rw, y + rh, x, y + rh, k)
      ctx.arcTo(x, y + rh, x, y, k)
      ctx.arcTo(x, y, x + rw, y, k)
      ctx.closePath()
    }
    const glow = (x: number, y: number, r: number, c: RGB | number[], a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, rgba(c, a))
      g.addColorStop(1, rgba(c, 0))
      ctx.fillStyle = g
      ctx.fillRect(x - r, y - r, r * 2, r * 2)
    }
    const chip = (x: number, y: number, text: string, alpha: number, dot: RGB, center: boolean) => {
      ctx.font = `500 13px ${fam}`
      const tw = ctx.measureText(text).width
      const cw = tw + 34, ch = 28
      const left = center ? x - cw / 2 : x
      ctx.globalAlpha = alpha
      rr(left, y - ch / 2, cw, ch, 14)
      ctx.fillStyle = m > 0.5 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.08)'
      ctx.fill()
      ctx.strokeStyle = rgba(col('accent', m), 0.35)
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(left + 14, y, 4, 0, Math.PI * 2)
      ctx.fillStyle = rgba(dot, 1)
      ctx.fill()
      ctx.fillStyle = rgba(col('ink', m), 0.95)
      ctx.textBaseline = 'middle'
      ctx.fillText(text, left + 25, y + 0.5)
      ctx.globalAlpha = 1
    }

    // ---------- update ----------
    const step = (dt: number) => {
      t += dt
      const target = themeRef.current === 'day' ? 1 : 0
      m += (target - m) * Math.min(1, dt * 3)
      if (Math.abs(target - m) < 0.002) m = target
      const tx = pxm < 0 ? 0 : (pxm / w - 0.5) * 2
      const ty = pym < 0 ? 0 : (pym / h - 0.5) * 2
      mx += (tx - mx) * Math.min(1, dt * 4)
      my += (ty - my) * Math.min(1, dt * 4)

      for (const c of clouds) { c.x += c.v * dt; if (c.x > w + 40) c.x = -220 }
      for (const n of nodes) {
        n.x += n.vx * dt; n.y += n.vy * dt
        if (n.x < -10) n.x = w + 10; else if (n.x > w + 10) n.x = -10
        if (n.y < -10) n.y = h + 10; else if (n.y > h + 10) n.y = -10
      }
      for (let i = 0; i < icons.length; i++) {
        const ic = icons[i]
        ic.y -= ic.sp * dt
        ic.rot += ic.rs * dt * 0.3
        if (ic.y < -60) icons[i] = newIcon(false)
      }
      const small = w < 640
      chipTimer -= dt
      if (chipTimer <= 0 && chips.length < (small ? 3 : 6)) {
        const x = w < 900 ? w * (0.04 + Math.random() * 0.4) : Math.random() < 0.5 ? w * (0.03 + Math.random() * 0.15) : w * (0.78 + Math.random() * 0.12)
        chips.push({ x, y: h * (0.3 + Math.random() * 0.55), age: 0, life: 6 + Math.random() * 2, key: Math.floor(Math.random() * MSG.en.length), vy: 10 + Math.random() * 10 })
        chipTimer = 1.6 + Math.random() * 1.6
      }
      for (const c of chips) { c.age += dt; c.y -= c.vy * dt }
      chips = chips.filter((c) => c.age < c.life)
    }

    // ---------- draw ----------
    function draw() {
      const L = langRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.globalAlpha = 1

      // ท้องฟ้า + แสงเรือง
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, rgba(col('skyTop', m), 1))
      g.addColorStop(1, rgba(col('skyBot', m), 1))
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
      glow(w * 0.85, -h * 0.05, Math.max(w, h) * 0.6, col('glowA', m), 0.32 + 0.1 * m)
      glow(-w * 0.05, h * 0.15, Math.max(w, h) * 0.5, col('glowB', m), 0.18 + 0.1 * m)

      // ตารางพื้นหลังเลื่อนช้า ๆ
      const gs = 72, off = (t * 6) % gs
      ctx.strokeStyle = rgba(col('accent', m), 0.05 + 0.03 * m)
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = -off; x < w; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
      for (let y = off; y < h; y += gs) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
      ctx.stroke()

      // ดาว (กลางคืน)
      if (m < 0.98) {
        for (const s of stars) {
          const a = (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.sp + s.ph))) * (1 - m) * 0.8
          ctx.fillStyle = `rgba(226,232,255,${a})`
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill()
        }
      }

      // ดวงจันทร์ / ดวงอาทิตย์
      const cr = Math.max(26, Math.min(60, Math.min(w, h) * 0.07))
      const cx = w * (w < 640 ? 0.82 : 0.88)
      const cy0 = Math.max(cr * 2.2, h * 0.15)
      const mo = 1 - m
      if (mo > 0.01) {
        const y = cy0 + m * cr * 5
        ctx.globalAlpha = mo
        glow(cx, y, cr * 3.6, [150, 175, 255], 0.22)
        const mg = ctx.createRadialGradient(cx - cr * 0.3, y - cr * 0.3, cr * 0.1, cx, y, cr)
        mg.addColorStop(0, '#F4F6FF'); mg.addColorStop(1, '#BAC6F0')
        ctx.fillStyle = mg
        ctx.beginPath(); ctx.arc(cx, y, cr, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = 'rgba(120,135,190,0.3)'
        for (const [dx, dy, r] of [[-0.3, -0.2, 0.2], [0.25, 0.15, 0.28], [-0.1, 0.45, 0.13]]) {
          ctx.beginPath(); ctx.arc(cx + dx * cr, y + dy * cr, r * cr, 0, Math.PI * 2); ctx.fill()
        }
        ctx.globalAlpha = 1
      }
      if (m > 0.01) {
        const y = cy0 + (1 - m) * cr * 5
        ctx.globalAlpha = m
        glow(cx, y, cr * 4.2, [255, 200, 90], 0.5)
        ctx.strokeStyle = 'rgba(255,190,80,0.75)'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + t * 0.15
          ctx.moveTo(cx + Math.cos(a) * cr * 1.35, y + Math.sin(a) * cr * 1.35)
          ctx.lineTo(cx + Math.cos(a) * cr * 1.7, y + Math.sin(a) * cr * 1.7)
        }
        ctx.stroke()
        const sg = ctx.createRadialGradient(cx - cr * 0.3, y - cr * 0.3, cr * 0.1, cx, y, cr)
        sg.addColorStop(0, '#FFF0B8'); sg.addColorStop(1, '#FFBE50')
        ctx.fillStyle = sg
        ctx.beginPath(); ctx.arc(cx, y, cr, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1
      }

      // เมฆ (กลางวัน)
      if (m > 0.02) {
        ctx.fillStyle = `rgba(255,255,255,${0.6 * m})`
        for (const c of clouds) {
          ctx.beginPath()
          for (const [bx, by, br] of [[0, 0, 30], [34, -14, 38], [78, -2, 30], [44, 10, 32], [14, 12, 24], [70, 12, 24]]) {
            ctx.moveTo(c.x + (bx + br) * c.s, c.y + by * c.s)
            ctx.arc(c.x + bx * c.s, c.y + by * c.s, br * c.s, 0, Math.PI * 2)
          }
          ctx.fill()
        }
      }

      // แท่งและเส้นกราฟยอดขาย (เลื่อนซ้าย โตขึ้นทางขวา)
      const sp = Math.max(72, w / 12), baseY = h, chartH = h * 0.34, scroll = t * 16
      const i0 = Math.floor(scroll / sp) - 1, n = Math.ceil(w / sp) + 3
      const accent = col('accent', m), accent2 = col('accent2', m)
      ctx.fillStyle = rgba(accent, 0.07 + 0.03 * m)
      for (let k = 0; k < n; k++) {
        const i = i0 + k, x = i * sp - scroll
        const v = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(i * 0.9 + 1.3) * Math.cos(i * 0.37))
        const bh = v * chartH * 0.8 * (0.94 + 0.06 * Math.sin(t * 1.4 + i))
        rr(x - sp * 0.17, baseY - bh, sp * 0.34, bh, 6)
        ctx.fill()
      }
      const fv = (x: number, a: number) => {
        const u = (x + scroll) / sp
        return 0.5 + 0.26 * Math.sin(0.5 * u + a) + 0.14 * Math.sin(1.31 * u + 2.1 * a + 1.7) + 0.07 * Math.sin(2.9 * u + 3 * a)
      }
      const fy = (x: number, a: number, amp: number) => baseY - 6 - fv(x, a) * chartH * amp - (x / w) * chartH * 0.45 * amp
      const line = (a: number, amp: number, c: RGB, alpha: number, fill: boolean) => {
        ctx.beginPath()
        for (let x = -10; x <= w + 10; x += 8) { const y = fy(x, a, amp); if (x === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
        if (m < 0.6) { ctx.strokeStyle = rgba(c, 0.12 * (1 - m)); ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.stroke() }
        ctx.strokeStyle = rgba(c, alpha); ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke()
        if (fill) {
          ctx.lineTo(w + 10, h); ctx.lineTo(-10, h); ctx.closePath()
          const fg = ctx.createLinearGradient(0, h - chartH * 1.5, 0, h)
          fg.addColorStop(0, rgba(c, 0.2)); fg.addColorStop(1, rgba(c, 0))
          ctx.fillStyle = fg; ctx.fill()
        }
      }
      line(2.4, 0.78, accent2, 0.4 + 0.1 * m, false)
      line(0, 1, accent, 0.55 + 0.1 * m, true)
      for (let k = 0; k < n; k++) {
        const x = (i0 + k) * sp - scroll
        ctx.beginPath(); ctx.arc(x, fy(x, 0, 1), 3.5, 0, Math.PI * 2)
        ctx.fillStyle = rgba(col('skyBot', m), 1); ctx.fill()
        ctx.strokeStyle = rgba(accent, 0.8); ctx.lineWidth = 1.5; ctx.stroke()
      }
      // จุดติดตามยอดขาย + วงคลื่น + ป้ายเปอร์เซ็นต์
      const tx = w * 0.72, ty = fy(tx, 0, 1)
      for (let r = 0; r < 2; r++) {
        const ph = (t * 0.5 + r * 0.5) % 1
        ctx.beginPath(); ctx.arc(tx, ty, 6 + ph * 30, 0, Math.PI * 2)
        ctx.strokeStyle = rgba(accent, (1 - ph) * 0.45); ctx.lineWidth = 1.5; ctx.stroke()
      }
      ctx.beginPath(); ctx.arc(tx, ty, 5.5, 0, Math.PI * 2); ctx.fillStyle = rgba(col('warm', m), 1); ctx.fill()
      const pct = Math.round(6 + fv(tx, 0) * 50)
      chip(tx, ty - 34, `${SALES[L]} +${pct}%`, 0.9, col('warm', m), true)

      // เครือข่ายลูกค้า (จุดเชื่อมกัน + เชื่อมกับเมาส์)
      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          const d2 = dx * dx + dy * dy
          if (d2 < 14400) {
            ctx.strokeStyle = rgba(accent, 0.14 * (1 - Math.sqrt(d2) / 120))
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y); ctx.stroke()
          }
        }
        if (mouseOn) {
          const dx = nodes[i].x - pxm, dy = nodes[i].y - pym, d = Math.sqrt(dx * dx + dy * dy)
          if (d < 170) {
            ctx.strokeStyle = rgba(accent2, 0.35 * (1 - d / 170))
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(pxm, pym); ctx.stroke()
          }
        }
      }
      ctx.fillStyle = rgba(accent, 0.45 + 0.15 * m)
      for (const nd of nodes) { ctx.beginPath(); ctx.arc(nd.x, nd.y, 2.2, 0, Math.PI * 2); ctx.fill() }

      // ไอคอนการตลาดลอยขึ้น
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      for (const ic of icons) {
        const px = ic.x + Math.sin(t * 0.6 + ic.ph) * ic.sway + mx * ic.size * 0.25
        const py = ic.y + my * ic.size * 0.25
        const a = ic.a * clamp01((h + 40 - ic.y) / 140) * clamp01((ic.y + 40) / 140)
        if (a <= 0.003) continue
        const c = col(ICON_COLORS[ic.ci], m)
        ctx.save()
        ctx.translate(px, py); ctx.rotate(ic.rot)
        const s = ic.size / 24
        ctx.scale(s, s); ctx.translate(-12, -12)
        if (m < 0.6) { ctx.strokeStyle = rgba(c, a * 0.22 * (1 - m)); ctx.lineWidth = 4.4; ctx.stroke(paths[ic.k]) }
        ctx.strokeStyle = rgba(c, a * (1 + 0.5 * m)); ctx.lineWidth = 1.7; ctx.stroke(paths[ic.k])
        ctx.restore()
      }

      // ป้ายแจ้งเตือนลอยขึ้น (เปลี่ยนภาษาตามที่เลือก)
      for (const c of chips) {
        const env = Math.min(c.age / 0.8, 1) * Math.min((c.life - c.age) / 1.2, 1)
        chip(c.x, c.y, MSG[L][c.key], clamp01(env) * 0.7, col(c.key % 2 ? 'accent2' : 'warm', m), false)
      }
      ctx.globalAlpha = 1
    }

    // ---------- loop ----------
    let last = performance.now()
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      step(dt)
      draw()
      raf = requestAnimationFrame(frame)
    }
    const start = () => {
      cancelAnimationFrame(raf)
      if (reduce) { m = themeRef.current === 'day' ? 1 : 0; draw() } else { last = performance.now(); raf = requestAnimationFrame(frame) }
    }
    kick.current = () => {
      fam = getComputedStyle(document.body).fontFamily
      if (reduce) { m = themeRef.current === 'day' ? 1 : 0; draw() }
    }

    const onMove = (e: PointerEvent) => { pxm = e.clientX; pym = e.clientY; mouseOn = e.pointerType === 'mouse' }
    const onLeave = () => { mouseOn = false; pxm = -1; pym = -1 }
    const onMq = () => { reduce = mq.matches; start() }

    resize()
    start()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    mq.addEventListener('change', onMq)
    return () => {
      cancelAnimationFrame(raf)
      kick.current = () => {}
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      mq.removeEventListener('change', onMq)
    }
  }, [])

  return <><div className="stage-base" aria-hidden="true" /><canvas ref={ref} className="stage" aria-hidden="true" /></>
}
