import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const titillium = Titillium_Web({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-titillium",
});

export const metadata: Metadata = {
  title: "F1 Tracker - Follow Formula 1",
  description: "Real-time standings, full calendar and predictions with friends",
  icons: {
    icon: "/f1-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${titillium.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}