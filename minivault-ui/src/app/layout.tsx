import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiniVault AI - Text Generation",
  description: "Model Vault Take Home Test",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
