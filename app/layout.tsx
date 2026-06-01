import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InstallPrompt from "@/components/InstallPrompt";
import UpdatePrompt from "@/components/UpdatePrompt";
import RegisterSW from "@/components/RegisterSW";
import OfflineSyncManager from "@/components/OfflineSyncManager";
import GlobalAchievementListener from "@/components/GlobalAchievementListener";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#22c55e",
};

export const metadata: Metadata = {
  title: "VEXX SQUAD",
  description: "Elite Training Log & Community",
  manifest: "/manifest.json",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
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
        <OfflineSyncManager />
        <GlobalAchievementListener />
        <UpdatePrompt />
        <main>{children}</main>
        <InstallPrompt />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </body>
    </html>
  );
}