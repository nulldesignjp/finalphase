import type { Metadata } from "next";
import "./globals.css";

import ThemeToggle from "./components/ThemeToggle";

// 1. next/font/google から使いたいフォントをインポート`
import { EB_Garamond, Zen_Kaku_Gothic_New } from "next/font/google";

// 2. 各フォントの設定（太さや、CSSで呼び出すための変数名を指定）
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
});

const zenKaku = Zen_Kaku_Gothic_New({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-zen-kaku",
});

export const metadata: Metadata = {
  title: "nulldesign.archives",
  description: "Killing time until death",
  // OGP設定などはここに記述
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedTheme = localStorage.getItem('theme');
                  if (storedTheme === 'dark' || storedTheme === 'light') {
                    document.documentElement.setAttribute('data-theme', storedTheme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      {/* 3. bodyタグの className に、設定したフォントの変数をすべて適用する */}
      <body
        className={`${ebGaramond.variable} ${zenKaku.variable} antialiased`}
      >
        <>
          {children}
        </>
      </body>
    </html>
  );
}
