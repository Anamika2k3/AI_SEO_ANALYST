import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppShell from "@/components/layout/AppShell";
import { DataProvider } from "@/contexts/DataContext";
import { PRODUCT_COPY } from "@/config/product";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${PRODUCT_COPY.productName} | ${PRODUCT_COPY.altName}`,
  description: PRODUCT_COPY.tagline,
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-950`}>
        <DataProvider>
          <AppShell>{children}</AppShell>
        </DataProvider>
      </body>
    </html>
  );
}
