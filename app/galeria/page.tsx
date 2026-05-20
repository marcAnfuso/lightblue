import Link from "next/link";
import Gallery from "@/components/gallery";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "galería de dibujos · paginita de Cele",
};

export default function GaleriaPage() {
  return (
    <main className="min-h-screen py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto mb-5 flex items-center justify-between">
        <Link
          href="/jugar"
          className="font-hand text-2xl text-white drop-shadow-[0_1px_3px_rgba(20,60,90,0.4)] hover:opacity-80 transition"
        >
          ← volver al juego
        </Link>
      </div>

      <h1 className="font-hand text-4xl text-white text-center mb-6 drop-shadow-[0_2px_4px_rgba(20,60,90,0.4)]">
        nuestros dibujitos 🖼️
      </h1>

      <Gallery />
    </main>
  );
}
