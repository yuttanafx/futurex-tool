// pageExtensions: ให้ Next มองเฉพาะ .ts/.tsx เป็นหน้า/route/middleware ไฟล์ .js/.jsx เก่าที่ค้างอยู่จะถูกข้าม
export default { pageExtensions: ['tsx', 'ts'], experimental: { serverActions: { bodySizeLimit: '12mb' } } }
