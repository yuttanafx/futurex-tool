import type { Provider } from '@/lib/aikeys'
// ตัวเรียกโมเดลรวม: Claude / GPT / Gemini ผ่านฟังก์ชันเดียว (ฝั่งเซิร์ฟเวอร์เท่านั้น)

export type Msg = { role: 'user' | 'assistant'; content: string }
export type LlmCode = 'bad_key' | 'bad_model' | 'provider_quota' | 'upstream' | 'empty' | 'timeout'
export class LlmError extends Error {
  constructor(public code: LlmCode) { super(code) }
}

const BASE = {
  anthropic: process.env.LLM_BASE_ANTHROPIC || 'https://api.anthropic.com',
  openai: process.env.LLM_BASE_OPENAI || 'https://api.openai.com',
  gemini: process.env.LLM_BASE_GEMINI || 'https://generativelanguage.googleapis.com',
} // ปรับได้เพื่อทดสอบเท่านั้น

function statusToCode(s: number): LlmCode {
  if (s === 400 || s === 401 || s === 403) return 'bad_key'
  if (s === 404) return 'bad_model'
  if (s === 429) return 'provider_quota'
  return 'upstream'
}

async function post(url: string, headers: Record<string, string>, body: unknown) {
  let r: Response
  try {
    r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(50_000) })
  } catch {
    throw new LlmError('timeout')
  }
  if (!r.ok) throw new LlmError(statusToCode(r.status)) // ไม่ส่งเนื้อหา error หรือ key ออกไป
  return r.json()
}

// Claude ต้องเริ่มด้วย user และสลับ user/assistant: รวมข้อความ role ซ้ำติดกัน
function alternate(msgs: Msg[]): Msg[] {
  const out: Msg[] = []
  for (const m of msgs) {
    const last = out[out.length - 1]
    if (last && last.role === m.role) last.content += '\n' + m.content
    else out.push({ ...m })
  }
  while (out.length && out[0].role !== 'user') out.shift()
  return out
}

export async function complete(o: {
  provider: Provider; key: string; model: string; system: string; messages: Msg[]; maxTokens: number; json?: boolean
}): Promise<{ text: string; units: number }> {
  // โมเดลที่คิดก่อนตอบ (Gemini / GPT) นับโทเคนคิดรวมในเพดานด้วย จึงเผื่อเพดานให้มากกว่าความยาวคำตอบจริง
  const roomy = Math.max(o.maxTokens * 4, 2048)

  if (o.provider === 'anthropic') {
    const j = await post(`${BASE.anthropic}/v1/messages`, { 'x-api-key': o.key, 'anthropic-version': '2023-06-01' }, {
      model: o.model, max_tokens: o.maxTokens, system: o.system, messages: alternate(o.messages),
    })
    const text = (j.content ?? []).map((b: any) => (b.type === 'text' ? b.text ?? '' : '')).join('').trim()
    if (!text) throw new LlmError('empty')
    return { text, units: (j.usage?.input_tokens ?? 0) + (j.usage?.output_tokens ?? 0) }
  }

  if (o.provider === 'gemini') {
    const j = await post(`${BASE.gemini}/v1beta/models/${encodeURIComponent(o.model)}:generateContent`, { 'x-goog-api-key': o.key }, {
      systemInstruction: { parts: [{ text: o.system }] },
      contents: o.messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: roomy, ...(o.json ? { responseMimeType: 'application/json' } : {}) },
    })
    const text = (j.candidates?.[0]?.content?.parts ?? []).map((p: any) => p.text ?? '').join('').trim()
    if (!text) throw new LlmError('empty')
    return { text, units: j.usageMetadata?.totalTokenCount ?? 0 }
  }

  const j = await post(`${BASE.openai}/v1/chat/completions`, { Authorization: `Bearer ${o.key}` }, {
    model: o.model, max_completion_tokens: roomy,
    ...(o.json ? { response_format: { type: 'json_object' } } : {}),
    messages: [{ role: 'system', content: o.system }, ...o.messages],
  })
  const text = j.choices?.[0]?.message?.content?.trim()
  if (!text) throw new LlmError('empty')
  return { text, units: j.usage?.total_tokens ?? 0 }
}
