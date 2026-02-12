import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { AuthProviderWrapper } from "@/components/auth-provider";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage-grotesque",
});

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
    <html className="dark" lang="en">
      <body className={`${bricolageGrotesque.variable} font-bricolage-grotesque`}>
        <AuthProviderWrapper>
          {children}
        </AuthProviderWrapper>
      </body>
    </html>
  );
}