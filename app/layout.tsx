import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Hanken_Grotesk,
  IBM_Plex_Mono,
} from "next/font/google";
import "./globals.css";
import { ToastProvider } from "./components/Toast";
import { Providers } from "./components/Providers";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
});

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Molly",
  description: "Gestão da epilepsia da Molly",
  applicationName: "Molly",
  appleWebApp: {
    capable: true,
    title: "Molly",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  // iOS ignores `media` on apple-touch-icon (unlike rel="icon"), and a web clip
  // can't switch icons by light/dark — so we declare ONE unconditional icon.
  // It's the gold-on-dark brand tile, which reads as intentional in both modes.
  icons: {
    apple: { url: "/pwa-icon/apple", sizes: "180x180", type: "image/png" },
  },
};

export const viewport: Viewport = {
  // Theme-aware browser chrome: brand gold in light, dark surface in dark.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#B27A22" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1712" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${bricolageGrotesque.variable} ${hankenGrotesk.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <ToastProvider>{children}</ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
