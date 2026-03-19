import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";
import UpdatePrompt from "@/components/UpdatePrompt";
import RegisterSW from "@/components/RegisterSW"; // Criaremos este componente abaixo

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VEXX SQUAD",
  description: "Elite Training Log & Community",
  manifest: "/manifest.json",
  themeColor: "#22c55e",
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
        {/* Componente invisível que registra o Service Worker no lado do cliente */}
        <RegisterSW />

        <UpdatePrompt />
        
        <main>{children}</main>
        
        <InstallPrompt />
      </body>
    </html>
  );
}