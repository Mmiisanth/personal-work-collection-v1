import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiotBus",
  description: "A brat-green artist battle machine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
