import { SiteHeader, SiteFooter } from '@/components/SiteChrome'
import MarketingBackground from '@/components/MarketingBackground'
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <div className="dk"><MarketingBackground /><SiteHeader />{children}<SiteFooter /></div>
}
