import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";
import UpdatePrompt from "@/components/UpdatePrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Metadados unificados para a Elite Squad
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {/* Banner de Atualização (Topo) */}
        <UpdatePrompt />
        
        {children}
        
        {/* Alerta de Instalação (Rodapé) */}
        <InstallPrompt />
      </body>
    </html>
  );
}