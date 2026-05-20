import type { Metadata } from "next";
import { Caveat, Kalam } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const kalam = Kalam({
  subsets: ["latin"],
  variable: "--font-kalam",
  display: "swap",
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "una paginita para Cele",
  description: "hecha con cariño",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${caveat.variable} ${kalam.variable} ${GeistSans.variable}`}
    >
      <body className="font-note antialiased">{children}</body>
    </html>
  );
}
