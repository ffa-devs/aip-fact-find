import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AIP Fact Find - Spanish Property Mortgage Application",
  description: "Complete your Spanish property mortgage application in minutes with FFA Mortgage Services",
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/ffa-logo.png', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "AIP Fact Find - Spanish Property Mortgage Application",
    description: "Complete your Spanish property mortgage application in minutes with FFA Mortgage Services",
    images: [
      {
        url: '/ffa-logo.png',
        width: 1200,
        height: 630,
        alt: 'FFA Mortgage Services',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "AIP Fact Find - Spanish Property Mortgage Application",
    description: "Complete your Spanish property mortgage application in minutes with FFA Mortgage Services",
    images: ['/ffa-logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
