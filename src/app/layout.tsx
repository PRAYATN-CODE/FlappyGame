import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from 'next/font/google';
import "./globals.css";

const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

// --- 1. Viewport Settings (Crucial for Mobile Games) ---
export const viewport: Viewport = {
  themeColor: "#2462ea", 
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming on double-tap
};

// --- 2. SEO & Author Metadata ---
export const metadata: Metadata = {
  // Basic SEO
  title: {
    default: "Flappy Float | Created by Prayatn Soni",
    template: "%s | Flappy Float"
  },
  description: "Play the ultimate Flappy-style arcade game featuring custom voice packs (PM Modi, SRK, Amitabh). Built with Next.js 15 by Prayatn Soni.",
  
  // Search Engine Keywords
  keywords: [
    "Flappy Game", 
    "Prayatn Soni", 
    "Next.js Game", 
    "React Arcade", 
    "PM Modi Voice Game", 
    "Web Game Developer"
  ],

  // Author / Creator Details
  authors: [
    { 
      name: "Prayatn Soni", 
      url: "https://x.com/Prayatn2005" // Linking X profile as primary author URL
    }
  ],
  creator: "Prayatn Soni", 
  publisher: "Prayatn Soni",

  // Open Graph (Facebook, LinkedIn, Discord previews)
  openGraph: {
    title: "Flappy Float by Prayatn Soni",
    description: "Can you beat the high score? Play now with custom audio themes. Developed by Prayatn Soni.",
    url: "https://x.com/Prayatn2005", // Or your game's deployed URL
    siteName: "Flappy Float",
    images: [
      {
        url: "/og-image.png", // Ensure you have an image in public/og-image.png
        width: 1200,
        height: 630,
        alt: "Flappy Float Game - Created by Prayatn Soni",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Flappy Float - Built by Prayatn Soni",
    description: "Try the new Flappy game with custom audio themes! Created by @Prayatn2005.",
    creator: "@Prayatn2005", // Your X Handle
    site: "@Prayatn2005",
    images: ["/og-image.png"],
  },

  // Robot indexing
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sourceSans3.variable} antialiased`}>
        {/* Added overflow-hidden to body to prevent scroll bounce on mobile games */}
        <main className="min-h-dvh flex-1 w-full text-foreground dark:text-dark-foreground bg-background dark:bg-dark-background overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}