'use server'
import { revalidatePath } from 'next/cache'
import { getContext } from '@/lib/tenant'

const clean = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().slice(0, max)
const url = (v: FormDataEntryValue | null) => { const s = clean(v, 500); return /^https?:\/\//i.test(s) ? s : '' }
const UUID = /^[0-9a-f-]{36}$/i

// tenant มาจาก session เสมอ + กรอง tenant_id ซ้ำนอกเหนือจาก RLS
export async function saveTemplate(fd: FormData) {
  const { sb, tenant } = await getContext()
  const name = clean(fd.get('name'), 120)
  if (!name) return
  const row = {
    name,
    price: clean(fd.get('price'), 9).replace(/[^0-9]/g, ''),
    caption: clean(fd.get('caption'), 2000),
    tags: clean(fd.get('tags'), 300),
    details: clean(fd.get('details'), 3000),
    fda_no: clean(fd.get('fda_no'), 40),
    source_url: url(fd.get('source_url')),
    tiktok_url: url(fd.get('tiktok_url')),
  }
  const id = String(fd.get('id') || '')
  if (UUID.test(id)) await sb.from('tiktok_templates').update({ ...row, updated_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', tenant.id)
  else await sb.from('tiktok_templates').insert({ tenant_id: tenant.id, ...row })
  revalidatePath('/app/tiktok')
}

export async function deleteTemplate(id: string) {
  const { sb, tenant } = await getContext()
  if (!UUID.test(id)) return
  await sb.from('tiktok_templates').delete().eq('id', id).eq('tenant_id', tenant.id)
  revalidatePath('/app/tiktok')
}
