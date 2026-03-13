import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Cairo } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/AppShell";
import { ensureScheduler } from "@/lib/scheduler";
import { getPlatformConfig } from "@/lib/platform-config";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"], weight: ["400","600","700","800","900"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: dark)",  color: "#030508" },
    { media: "(prefers-color-scheme: light)", color: "#030508" },
  ],
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const config = getPlatformConfig();
  return {
    title: {
      default: "يالا نلعب — منصة الألعاب العربية",
      template: "%s · يالا نلعب",
    },
    description: "العب دومينو، شطرنج، بلوت، لودو — وارفع شعار بلدك في معركة الدول الأسبوعية",
    keywords: ["يالا نلعب", "دومينو", "شطرنج", "بلوت", "لودو", "العاب عربية", "العاب اونلاين"],
    authors: [{ name: "يالا نلعب" }],
    creator: "يالا نلعب",
    publisher: "يالا نلعب",

    // PWA
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "يالا نلعب",
      startupImage: ["/icons/icon-512.png"],
    },

    // OpenGraph
    openGraph: {
      type: "website",
      locale: "ar_SA",
      title: "يالا نلعب — منصة الألعاب العربية",
      description: "العب لبلدك. تحدّى الدول. ارفع الراية.",
      siteName: "يالا نلعب",
      images: [{ url: "/branding/1772931007554_logo.png", width: 512, height: 512, alt: "يالا نلعب" }],
    },

    // Icons
    icons: {
      icon: [
        { url: "/icons/icon-32.png",  sizes: "32x32",  type: "image/png" },
        { url: "/icons/icon-96.png",  sizes: "96x96",  type: "image/png" },
        { url: "/icons/icon-192.png", sizes: "192x192",type: "image/png" },
      ],
      apple: [
        { url: "/icons/icon-152.png", sizes: "152x152" },
        { url: "/icons/icon-192.png", sizes: "192x192" },
      ],
      shortcut: "/icons/icon-96.png",
    },

    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
      "format-detection": "telephone=no",
      "msapplication-TileColor": "#030508",
      "msapplication-TileImage": "/icons/icon-144.png",
    },
  };
}

async function getAnnouncementText() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/announcement`, { cache: "no-store" });
    const data = await res.json();
    return String(data?.text || "مرحبًا بكم في يالا نلعب — شارك الآن في البطولات المباشرة");
  } catch {
    return "مرحبًا بكم في يالا نلعب — شارك الآن في البطولات المباشرة";
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  ensureScheduler();
  const announcementText = await getAnnouncementText();
  const config = getPlatformConfig();

  return (
    <html lang="ar" dir="rtl" className="overflow-x-hidden">
      <head>
        {/* Service Worker registration */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js')
                .then(function(reg) { console.log('SW registered'); })
                .catch(function(err) { console.log('SW error:', err); });
            });
          }
        `}} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${cairo.variable} font-sans antialiased overflow-x-hidden`}>
        <AppShell announcementText={announcementText} config={config}>{children}</AppShell>
      </body>
    </html>
  );
}
