import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { type ReactNode } from "react";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Bout System",
  description: "Developped for blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
