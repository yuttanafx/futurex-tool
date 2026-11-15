'use client'
import { useEffect, useRef, useState } from 'react'
import { usePrefs } from '@/components/Prefs'
import { saveTemplate, deleteTemplate } from './actions'

export type Template = {
  id: string; name: string; price: string; caption: string; tags: string
  details: string; fda_no: string; source_url: string; tiktok_url: string
}

const fmtPrice = (p: string) => { const n = String(p || '').replace(/[^0-9]/g, ''); return n ? '฿' + Number(n).toLocaleString('th-TH') : '' }
// คัดลอกทั้งหมด: ชื่อ+ราคา, แคปชัน, เลข อย. (ถ้ามี), แฮชแท็ก (รายละเอียดและลิงก์ไม่รวม)
const fullText = (t: Template) =>
  [t.name + (fmtPrice(t.price) ? ' ' + fmtPrice(t.price) : ''), t.caption, t.fda_no ? 'เลข อย. ' + t.fda_no : '', t.tags].filter(Boolean).join('\n\n')

async function writeClipboard(text: string) {
  try { await navigator.clipboard.writeText(text); return true } catch {
    const ta = document.createElement('textarea')
    ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'
    document.body.appendChild(ta); ta.select()
    let ok = false
    try { ok = document.execCommand('copy') } catch {}
    document.body.removeChild(ta)
    return ok
  }
}

export default function TemplateManager({ items }: { items: Template[] }) {
  const { lang } = usePrefs()
  const tr = (th: string, en: string, zh: string) => ({ th, en, zh }[lang])
  const [editing, setEditing] = useState<Template | null>(null)
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [toast, setToast] = useState('')
  const [sureId, setSureId] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)) }
  const flash = (m: string) => { setToast(m); later(() => setToast(''), 1600) }

  async function copy(text: string, label: string) {
    if (!text) return flash(tr('ช่องนี้ยังว่าง', 'This field is empty', '此项为空'))
    const ok = await writeClipboard(text)
    flash(ok ? tr(`คัดลอก${label}แล้ว`, `${label} copied`, `已复制${label}`) : tr('คัดลอกไม่สำเร็จ ลองกดค้างที่ข้อความแล้วเลือกคัดลอก', "Couldn't copy. Long-press the text and copy it.", '复制失败，请长按文字后选择复制'))
  }
  async function onSubmit(fd: FormData) {
    await saveTemplate(fd)
    setEditing(null); setOpen(false); setFormKey((k) => k + 1)
    flash(tr('บันทึกแล้ว', 'Saved', '已保存'))
  }
  const startEdit = (it: Template) => { setEditing(it); setOpen(true); setFormKey((k) => k + 1) }
  const cancel = () => { setEditing(null); setOpen(false); setFormKey((k) => k + 1) }
  async function remove(id: string) {
    if (sureId !== id) { setSureId(id); later(() => setSureId((c) => (c === id ? null : c)), 2500); return }
    await deleteTemplate(id); setSureId(null)
    flash(tr('ลบสินค้าแล้ว', 'Deleted', '已删除'))
  }

  const needle = q.trim().toLowerCase()
  const shown = needle ? items.filter((it) => (it.name + ' ' + it.tags).toLowerCase().includes(needle)) : items

  const fields: { name: keyof Template; area?: boolean; type?: string; max: number; label: string; ph: string; req?: boolean }[] = [
    { name: 'name', max: 120, req: true, label: tr('ชื่อสินค้า', 'Product name', '商品名称'), ph: tr('เช่น เซรั่มวิตามินซี 30 มล.', 'e.g. Vitamin C serum 30 ml', '例如 维C精华 30ml') },
    { name: 'price', max: 9, label: tr('ราคา (บาท)', 'Price (THB)', '价格（泰铢）'), ph: '259' },
    { name: 'caption', area: true, max: 2000, label: tr('แคปชัน', 'Caption', '文案'), ph: tr('ข้อความที่ใช้โพสต์คู่กับคลิป', 'Text to post with the clip', '与视频一起发布的文字') },
    { name: 'tags', max: 300, label: tr('แฮชแท็ก', 'Hashtags', '话题标签'), ph: '#รีวิวของดี #tiktokshop' },
    { name: 'fda_no', max: 40, label: tr('เลข อย. (ถ้ามี)', 'FDA no. (optional)', 'FDA 编号（可选）'), ph: '10-1-12345-1-0001' },
    { name: 'details', area: true, max: 3000, label: tr('รายละเอียดสินค้า (ส่วนผสม ขนาด วิธีใช้ ไม่รวมในปุ่มคัดลอกทั้งหมด)', 'Product details (ingredients, size, usage; not in Copy all)', '商品详情（成分、规格、用法；不含在“复制全部”中）'), ph: '' },
    { name: 'source_url', type: 'url', max: 500, label: tr('ลิงก์หน้าสินค้าต้นทาง (ถ้ามี)', 'Source product page (optional)', '商品来源链接（可选）'), ph: 'https://' },
    { name: 'tiktok_url', type: 'url', max: 500, label: tr('ลิงก์ตะกร้า / สินค้า TikTok Shop (ถ้ามี)', 'TikTok Shop basket / product link (optional)', 'TikTok Shop 购物车/商品链接（可选）'), ph: 'https://vt.tiktok.com/…' },
  ]

  return (
    <>
      <details className="card mt-6" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary className="cursor-pointer font-medium">{editing ? tr('แก้ไขสินค้า', 'Edit product', '编辑商品') : tr('เพิ่มสินค้าใหม่', 'Add a product', '添加商品')}</summary>
        <form key={formKey} action={onSubmit} autoComplete="off" className="mt-4 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="id" value={editing?.id ?? ''} />
          {fields.map((f) => (
            <label key={f.name} className={'block text-sm ' + (f.area || f.name === 'name' ? 'md:col-span-2' : '')}>
              {f.label}
              {f.area
                ? <textarea name={f.name} rows={3} maxLength={f.max} defaultValue={(editing?.[f.name] as string) ?? ''} placeholder={f.ph} className="input mt-1" />
                : <input name={f.name} type={f.type ?? 'text'} required={f.req} maxLength={f.max} inputMode={f.name === 'price' ? 'numeric' : undefined} defaultValue={(editing?.[f.name] as string) ?? ''} placeholder={f.ph} className="input mt-1" />}
            </label>
          ))}
          <div className="flex gap-2 md:col-span-2">
            <button className="btn" type="submit">{editing ? tr('บันทึกการแก้ไข', 'Save changes', '保存修改') : tr('บันทึกสินค้า', 'Save product', '保存商品')}</button>
            {editing && <button className="btn-ghost" type="button" onClick={cancel}>{tr('ยกเลิกการแก้ไข', 'Cancel', '取消')}</button>}
          </div>
        </form>
      </details>

      {items.length > 3 && (
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} className="input mt-4" placeholder={tr('ค้นหาสินค้า', 'Search products', '搜索商品')} aria-label={tr('ค้นหาสินค้า', 'Search products', '搜索商品')} />
      )}

      {items.length === 0 ? (
        <div className="card mt-6 text-sm text-ink/60">{tr('ยังไม่มีสินค้า กดเพิ่มสินค้าใหม่ด้านบนเพื่อสร้างเทมเพลตแรก', 'No products yet. Add your first template above.', '还没有商品，请在上方添加第一个模板。')}</div>
      ) : shown.length === 0 ? (
        <div className="card mt-6 text-sm text-ink/60">{tr(`ไม่พบสินค้าที่ตรงกับ "${q}"`, `No products match "${q}"`, `没有匹配“${q}”的商品`)}</div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {shown.map((it) => (
            <li key={it.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-bold">{it.name}</h2>
                {fmtPrice(it.price) && <span className="shrink-0 font-medium text-brand">{fmtPrice(it.price)}</span>}
              </div>
              <p className="text-xs text-ink/60">{it.fda_no ? `อย. ${it.fda_no}` : tr('ยังไม่ใส่เลข อย.', 'No FDA number yet', '尚未填写 FDA 编号')}</p>
              {it.caption && <p className="whitespace-pre-wrap text-sm">{it.caption}</p>}
              {it.tags && <p className="text-sm text-brand">{it.tags}</p>}
              {it.details && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-ink/70">{tr('รายละเอียดสินค้า', 'Product details', '商品详情')}</summary>
                  <p className="mt-2 whitespace-pre-wrap">{it.details}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="btn-ghost py-1" onClick={() => copy(it.details, tr('รายละเอียด', 'Details', '详情'))}>{tr('คัดลอกรายละเอียด', 'Copy details', '复制详情')}</button>
                    {it.source_url && <a className="btn-ghost py-1" href={it.source_url} target="_blank" rel="noopener noreferrer">{tr('ดูหน้าสินค้าต้นทาง', 'Source page', '来源页面')}</a>}
                  </div>
                </details>
              )}
              <button type="button" className="btn w-full justify-center" onClick={() => copy(fullText(it), tr('ทั้งหมด', 'All', '全部'))}>{tr('คัดลอกทั้งหมด', 'Copy all', '复制全部')}</button>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-ghost py-1" onClick={() => copy(it.name, tr('ชื่อสินค้า', 'Name', '名称'))}>{tr('ชื่อสินค้า', 'Name', '名称')}</button>
                <button type="button" className="btn-ghost py-1" onClick={() => copy(it.caption, tr('แคปชัน', 'Caption', '文案'))}>{tr('แคปชัน', 'Caption', '文案')}</button>
                <button type="button" className="btn-ghost py-1" onClick={() => copy(it.tags, tr('แฮชแท็ก', 'Hashtags', '标签'))}>{tr('แฮชแท็ก', 'Hashtags', '标签')}</button>
              </div>
              <div className="rounded-md bg-ink/5 p-3 text-sm">
                {it.tiktok_url ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn py-1" onClick={() => copy(it.tiktok_url, tr('ลิงก์ตะกร้า TikTok', 'Basket link', '购物车链接'))}>{tr('คัดลอกลิงก์ตะกร้า TikTok', 'Copy TikTok basket link', '复制 TikTok 购物车链接')}</button>
                    <a className="btn-ghost py-1" href={it.tiktok_url} target="_blank" rel="noopener noreferrer">{tr('เปิดลิงก์ตะกร้า ↗', 'Open basket link ↗', '打开购物车链接 ↗')}</a>
                  </div>
                ) : <span className="text-ink/60">{tr('ยังไม่ใส่ลิงก์ตะกร้า TikTok กดแก้ไขเพื่อเพิ่ม', 'No TikTok basket link yet. Edit to add one.', '尚未添加 TikTok 购物车链接，点击编辑添加。')}</span>}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn-ghost py-1" onClick={() => startEdit(it)}>{tr('แก้ไข', 'Edit', '编辑')}</button>
                <button type="button" className={'btn-ghost py-1 ' + (sureId === it.id ? 'text-red-600' : '')} onClick={() => remove(it.id)}>{sureId === it.id ? tr('กดอีกครั้งเพื่อลบ', 'Tap again to delete', '再点一次删除') : tr('ลบ', 'Delete', '删除')}</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {toast && <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-mist shadow">{toast}</div>}
    </>
  )
}
