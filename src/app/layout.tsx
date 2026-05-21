import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hris.manggala.biz.id"),
  title: {
    default:
      "MAS — Manggala Attendant System | Sistem Absensi & Payroll Otomatis Indonesia",
    template: "%s | MAS",
  },
  description:
    "MAS (Manggala Attendant System) — platform HRIS lengkap dengan absensi face recognition, GPS geofencing, payroll otomatis sesuai PPh 21 TER 2024, BPJS, THR, dan lembur Permenaker. Managed by PT Manggala Utama Indonesia.",
  manifest: "/manifest.webmanifest",
  applicationName: "MAS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MAS",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/logo.png",
  },
  authors: [{ name: "PT Manggala Utama Indonesia" }],
  creator: "PT Manggala Utama Indonesia",
  publisher: "PT Manggala Utama Indonesia",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#3a5cff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin=""
        />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
