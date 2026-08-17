import type { Metadata } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const display = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin", "latin-ext"],
  weight: ["600", "700"],
});

const description =
  "Zvanični sajt fudbalskog kluba FK Pobjeda Triješnica. Prva opštinska liga Bijeljina, raspored, tabela, igrači i statistika.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "FK Pobjeda Triješnica",
    template: "%s · FK Pobjeda Triješnica",
  },
  description,
  icons: { icon: "/logo.svg" },
  openGraph: {
    title: "FK Pobjeda Triješnica",
    description,
    locale: "sr_Latn",
    type: "website",
    siteName: "FK Pobjeda Triješnica",
  },
  twitter: {
    card: "summary",
    title: "FK Pobjeda Triješnica",
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="sr-Latn"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full bg-cream font-sans text-navy">
        {children}
      </body>
    </html>
  );
}
