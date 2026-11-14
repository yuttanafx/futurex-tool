/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    // pg ใช้ในฝั่งเซิร์ฟเวอร์เท่านั้น ไม่ต้องบันเดิล
    serverComponentsExternalPackages: ["pg"],
  },
};
