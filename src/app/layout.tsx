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
    default: "Sabha · see the reasoning before your agent acts",
    template: "%s · Sabha",
  },
  description:
    "Sabha makes the reasoning behind your AI agent's decisions visible, challenges it from multiple perspectives, and gives you control over what gets acted on.",
  applicationName: "Sabha",
  keywords: [
    "AI agent",
    "AI transparency",
    "decision making",
    "AI oversight",
    "informed agency",
    "Sabha",
  ],
  authors: [{ name: "Sabha" }],
  openGraph: {
    type: "website",
    title: "Sabha · see the reasoning before your agent acts",
    description:
      "Living Memory corrects the information. Council challenges the reasoning. Gate enforces your decision.",
    url: siteUrl,
    siteName: "Sabha",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sabha · see the reasoning before your agent acts",
    description:
      "Make the reasoning behind your AI agent's decisions visible — then decide what gets acted on.",
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
