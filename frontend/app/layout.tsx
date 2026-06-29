import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_Thai } from "next/font/google";
import { Providers } from "./providers";
import { getPublicSettings } from "@/lib/cms";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Noto Sans Thai — หัวตัด (no-loop) Thai sans-serif. Default sans-serif looped variant
// is `Noto Sans Thai Looped`; this one is the modern non-looped style.
const notoSansThai = Noto_Sans_Thai({
  variable: "--font-noto-thai",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getPublicSettings();
  const name = s?.siteName || "PMN Digital";
  return {
    title: { default: s?.defaultMetaTitle || name, template: `%s · ${name}` },
    description: s?.defaultMetaDesc || "PMN Digital",
    keywords: s?.defaultKeywords ? s.defaultKeywords.split(",").map((k) => k.trim()) : undefined,
    icons: s?.faviconUrl ? { icon: s.faviconUrl } : undefined,
    openGraph: {
      siteName: name,
      images: s?.ogDefaultUrl ? [s.ogDefaultUrl] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansThai.variable} h-full antialiased`}
    >
      <head>
        {/* IBM Plex family — used by the agency landing page (loaded by literal family name) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${notoSansThai.className} min-h-full flex flex-col`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
