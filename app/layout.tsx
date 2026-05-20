import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
});

export const metadata: Metadata = {
  title: "una paginita para Cele",
  description: "hecha con cariñito",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${GeistSans.variable}`}>
      <body className="font-sans antialiased">
        <div className="sky-bg" aria-hidden />
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}
