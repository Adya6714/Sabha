import type { Metadata } from "next";
import { Cormorant_Garamond, Figtree } from "next/font/google";
import { CarpetFrame } from "@/components/CarpetFrame";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const body = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sabha.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Sabha · governance between intention and AI action",
    template: "%s · Sabha",
  },
  description:
    "Sabha is a governance layer between human intention and autonomous AI action — making authority, incentives, assumptions and decisions visible, contestable and accountable.",
  applicationName: "Sabha",
  keywords: [
    "AI agent",
    "AI governance",
    "multi-agent delegation",
    "AI transparency",
    "authority registry",
    "informed agency",
    "Sabha",
  ],
  authors: [{ name: "Sabha" }],
  openGraph: {
    type: "website",
    title: "Sabha · governance between intention and AI action",
    description:
      "Intelligence can be delegated. Authority should not be surrendered silently.",
    url: siteUrl,
    siteName: "Sabha",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sabha · governance between intention and AI action",
    description:
      "A governance layer that keeps AI authority, incentives and decisions visible and accountable.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full`}
    >
      <body className="has-carpet-frame min-h-full antialiased">
        <CarpetFrame />
        {children}
      </body>
    </html>
  );
}
