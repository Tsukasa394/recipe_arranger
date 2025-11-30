import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ちょい足しアレンジレシピアプリ",
  description: "冷蔵庫の残り物が、プロ級の一品に変身！AIがアレンジレシピを提案します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
