import type { Metadata } from "next";
import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getSiteUrl } from "@/lib/site";
import {
  OUR_CLUB_LOGO,
  OUR_CLUB_LOGO_HEIGHT,
  OUR_CLUB_LOGO_PNG,
  OUR_CLUB_LOGO_WIDTH,
} from "@/lib/sportdc/types";

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
  icons: {
    icon: OUR_CLUB_LOGO,
    apple: OUR_CLUB_LOGO_PNG,
  },
  openGraph: {
    title: "FK Pobjeda Triješnica",
    description,
    locale: "sr_Latn",
    type: "website",
    siteName: "FK Pobjeda Triješnica",
    images: [
      {
        url: OUR_CLUB_LOGO_PNG,
        width: OUR_CLUB_LOGO_WIDTH,
        height: OUR_CLUB_LOGO_HEIGHT,
        alt: "FK Pobjeda Triješnica — 50 godina",
      },
    ],
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
      <body suppressHydrationWarning className="min-h-full font-sans text-white">
        {children}
      </body>
    </html>
  );
}
