import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🔗</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Link not found</h1>
        <p className="text-gray-500 text-sm mb-8">
          This link doesn&apos;t exist or has been removed by its creator.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
        >
          Go to Unlock
        </Link>
      </div>
    </main>
  );
}
