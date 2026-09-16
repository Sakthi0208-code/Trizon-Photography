import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trizen | Event Photography Platform",
  description:
    "Manage event photography, curate photographs, and securely deliver client galleries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}