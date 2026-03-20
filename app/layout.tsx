import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";
import UpdatePrompt from "@/components/UpdatePrompt";
import RegisterSW from "@/components/RegisterSW";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 1. Mova o themeColor para cá para sumir os avisos do terminal
export const viewport: Viewport = {
  themeColor: "#22c55e",
};

// 2. Unifiquei os dois blocos de metadata em um só
export const metadata: Metadata = {
  title: "VEXX SQUAD",
  description: "Elite Training Log & Community",
  manifest: "/manifest.json",
  openGraph: {
    title: 'VEXX SQUAD',
    description: 'Treine como um soldado de elite.',
    images: ['/logo-compartilhamento.png'], 
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
        suppressHydrationWarning={true}
      >
        <RegisterSW />
        <UpdatePrompt />
        <main>{children}</main>
        <InstallPrompt />
      </body>
    </html>
  );
}