export const baht = (n: number) => "฿" + new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(n)
export const bkkDay = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" })
export const discountPct = (price: number, compare?: number | null) => compare && compare > price ? Math.round((1 - price / compare) * 100) : 0
