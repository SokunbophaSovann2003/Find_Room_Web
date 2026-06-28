import type { Metadata, Viewport } from "next";
import { Poppins, Noto_Sans_Khmer } from "next/font/google";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import AdminFloatingNav from "@/components/admin/AdminFloatingNav";
import Footer from "@/components/Footer";
import Toaster from "@/components/Toaster";
import HtmlLangSync from "@/components/HtmlLangSync";
import OfflineBanner from "@/components/OfflineBanner";
import "./globals.css";

// next/font self-hosts the font files at build time. That avoids the
// Google Fonts CDN entirely, eliminates layout shift, and — critically —
// fixes Android phones that were silently failing to fetch Khmer glyphs
// via the CSS @import. Noto Sans Khmer renders with substantially
// heavier, more visible strokes than Kantumruy Pro at every weight.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap"
});

const notoKhmer = Noto_Sans_Khmer({
  subsets: ["khmer"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-khmer",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Joul.KH — Find your perfect room rental in Cambodia",
  description:
    "Browse verified rooms for rent across Phnom Penh and all of Cambodia, or list your own room in minutes.",
  keywords: ["room for rent", "ជួលបន្ទប់", "Phnom Penh room rental", "Cambodia room", "find room Cambodia", "joulkh"],
  metadataBase: new URL("https://joulkh.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Joul.KH — Find your perfect room rental in Cambodia",
    description: "Browse verified rooms for rent across Phnom Penh and all of Cambodia, or list your own room in minutes.",
    url: "https://joulkh.com",
    siteName: "Joul.KH",
    locale: "km_KH",
    alternateLocale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Joul.KH — Find your perfect room rental in Cambodia",
    description: "Browse verified rooms for rent across Phnom Penh and all of Cambodia.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg"
  },
  appleWebApp: {
    capable: true,
    title: "Joul",
    statusBarStyle: "default"
  }
};

// `viewport` is a separate export in Next 14+. `themeColor` here drives the
// Android status-bar colour when the site is launched as a PWA.
export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${notoKhmer.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
          <BottomNav />
          <AdminFloatingNav />
        </main>
        <Footer />
        <Toaster />
        <OfflineBanner />
        <HtmlLangSync />
      </body>
    </html>
  );
}
