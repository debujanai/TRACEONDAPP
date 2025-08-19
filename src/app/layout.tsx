import type { Metadata } from "next";
import "./globals.css";
import { WalletProvider } from "@/contexts/WalletContext";
import { MessagingProvider } from "@/contexts/MessagingContext";

export const metadata: Metadata = {
  title: "TraceOnAI DAPP",
  description: "See What Market Misses",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-['ClashGrotesk-Light'] text-white antialiased">
        <WalletProvider>
          <MessagingProvider>
            {children}
          </MessagingProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
