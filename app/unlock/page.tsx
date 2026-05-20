import UnlockForm from "@/components/unlock-form";

export const metadata = {
  title: "🔒 paginita de Cele",
};

export default function UnlockPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <UnlockFormWrapper searchParams={searchParams} />
    </main>
  );
}

async function UnlockFormWrapper({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return <UnlockForm nextPath={next ?? "/"} />;
}
