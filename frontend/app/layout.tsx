import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Launchpad",
  description: "One-click deployment platform with real-time logs and preview environments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/1356/1356479.png" />
      </head>
      <body className={`${bricolage.className} antialiased bg-black text-white min-h-screen`}>{children}</body>
    </html>
  );
}