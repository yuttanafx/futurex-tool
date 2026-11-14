import "./globals.css";

export const metadata = {
  title: "เทมเพลตปักตะกร้า",
  description: "เก็บชื่อสินค้า แคปชัน และแฮชแท็กสำหรับปักตะกร้า TikTok Shop แยกตามบัญชี",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600&family=Prompt:wght@500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
