import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextYT",
  description: "YT to MP4/MP3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} antialiased bg-stone-950 text-stone-50 min-h-dvh p-16 flex flex-col justify-center`}
      >
        {children}
      </body>
    </html>
  );
}
