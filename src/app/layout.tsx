import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "unipixel",
  description: "Meet people at your institution.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
