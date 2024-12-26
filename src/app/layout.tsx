import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PropsWithChildren } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DinoHunt Game",
  description: "An exciting dinosaur hunting game where you face off against prehistoric creatures",
  keywords: ["game", "dinosaur", "hunting", "action", "browser game"],
  authors: [
    { name: "Brian Fakhoury" },
    { name: "Cedar Hulick" }
  ],
  openGraph: {
    images: [
      {
        url: "/wallpaper.png",
        width: 1792,
        height: 1024,
        alt: "Dino Hunter Game",
      },
    ],
    type: "website",
  },
  robots: "index, follow",
  icons: {
    icon: "assets/dinosaurs/t-rex.png",
    shortcut: "assets/dinosaurs/t-rex.png",
    apple: "assets/dinosaurs/t-rex.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2C5530",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
