import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import BottomNav from "@/components/BottomNav";
import AdminFloatingNav from "@/components/admin/AdminFloatingNav";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "FindRoom.KH — Find your perfect room rental in Cambodia",
  description:
    "Browse verified rooms for rent across Phnom Penh and all of Cambodia, or list your own room in minutes.",
  // PWA wiring: the manifest tells the browser this site is installable.
  // When the user picks "Add to Home Screen", Android opens it in standalone
  // mode — no URL bar, no scroll-to-top button, no overlap with our FAB.
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: "/icon.svg"
  },
  appleWebApp: {
    capable: true,
    title: "FindRoom",
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
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
          <BottomNav />
          <AdminFloatingNav />
        </main>
        <Footer />
      </body>
    </html>
  );
}
