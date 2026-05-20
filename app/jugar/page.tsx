import Link from "next/link";
import Pictionary from "@/components/pictionary";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "dibujá y adiviná · paginita de Cele",
};

export default function JugarPage() {
  return (
    <main className="min-h-screen py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-md mx-auto mb-5">
        <Link
          href="/"
          className="font-hand text-2xl text-white drop-shadow-[0_1px_3px_rgba(20,60,90,0.4)] hover:opacity-80 transition"
        >
          ← volver a la paginita
        </Link>
      </div>

      <Pictionary />

      <footer className="mt-10 text-center font-hand text-xl text-white/80 drop-shadow-[0_1px_3px_rgba(20,60,90,0.4)]">
        turnos sin apuro · jueguen cuando puedan
      </footer>
    </main>
  );
}
