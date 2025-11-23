import { Source_Sans_3 } from 'next/font/google';
import "./globals.css";


const sourceSans3 = Source_Sans_3({
  variable: "--font-source-sans-3",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"], // Adjust as needed
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sourceSans3.variable} antialiased`}>
        <main className="min-h-dvh flex-1 w-full text-foreground dark:text-dark-foreground bg-background dark:bg-dark-background">
          {children}
        </main>
      </body>
    </html>
  );
}
