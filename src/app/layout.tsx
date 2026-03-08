import type { Metadata } from "next";
import { Cal_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AnchoredToastProvider, ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/components/theme-provider";

const calSans = Cal_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Badminton Tracker",
  description: "Track badminton matches, scores, and checkpoints.",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${calSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
            <ToastProvider>
              <AnchoredToastProvider>
                {children}
                {modal}
              </AnchoredToastProvider>
            </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
