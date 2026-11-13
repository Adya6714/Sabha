import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import "./globals.css";

const dm = DM_Sans({
  variable: "--font-dm",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
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
    <html lang="en" className={`${dm.variable} ${lora.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
