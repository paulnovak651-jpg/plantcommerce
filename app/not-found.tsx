import Link from 'next/link';
import { SearchForm } from '@/components/SearchForm';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="mb-2 text-6xl font-bold text-green-800">404</h1>
      <h2 className="mb-4 text-xl font-semibold text-gray-700">
        Page Not Found
      </h2>
      <p className="mb-8 text-gray-500">
        The plant you&apos;re looking for doesn&apos;t seem to exist here.
        Try searching or browse our species list.
      </p>

      <div className="mb-8">
        <SearchForm size="md" placeholder="Search plants, cultivars..." />
      </div>

      <div className="flex justify-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
        >
          Go Home
        </Link>
        <Link
          href="/nurseries"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Browse Nurseries
        </Link>
      </div>
    </div>
  );
}
