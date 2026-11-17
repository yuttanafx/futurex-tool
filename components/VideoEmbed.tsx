'use client'
import { T } from '@/components/Prefs'

type Parsed = { kind: 'iframe'; src: string } | { kind: 'file'; src: string } | null

/** แปลงลิงก์วิดีโอทั่วไปให้เป็นลิงก์ฝัง (embed) */
export function parseVideoUrl(raw: string): Parsed {
  const url = raw.trim()
  if (!url) return null
  let u: URL
  try { u = new URL(url) } catch { return null }
  const host = u.hostname.replace(/^www\./, '')
  if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) return { kind: 'file', src: url }
  if (host === 'youtu.be') return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}` }
  if (host.endsWith('youtube.com')) {
    const id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1]
    return id ? { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` } : null
  }
  if (host === 'vimeo.com') {
    const id = u.pathname.match(/\/(\d+)/)?.[1]
    return id ? { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` } : null
  }
  if (host === 'drive.google.com') {
    const id = u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1]
    return id ? { kind: 'iframe', src: `https://drive.google.com/file/d/${id}/preview` } : null
  }
  return null
}

export default function VideoEmbed({ url, title, className = '' }: { url?: string; title?: string; className?: string }) {
  const v = url ? parseVideoUrl(url) : null
  const box = `relative aspect-video w-full overflow-hidden rounded-xl border border-ink/15 bg-black/40 ${className}`
  if (!v) {
    return (
      <div className={`${box} grid place-items-center text-center`} role="img" aria-label="Video placeholder">
        <div className="px-6">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/10 text-3xl" aria-hidden>▶</div>
          <p className="mt-3 font-medium"><T th="วิดีโอแนะนำการใช้งานกำลังจะมาเร็วๆ นี้" en="The tutorial video is coming soon" zh="使用教程视频即将上线" /></p>
        </div>
      </div>
    )
  }
  return v.kind === 'file' ? (
    <div className={box}><video src={v.src} controls playsInline preload="metadata" className="h-full w-full" title={title} /></div>
  ) : (
    <div className={box}>
      <iframe src={v.src} title={title ?? 'Tutorial video'} loading="lazy" className="absolute inset-0 h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    </div>
  )
}
