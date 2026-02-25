import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-16">
      <p className="mb-6 font-serif text-[3rem] font-semibold text-text-tertiary">404</p>
      <EmptyState
        title="Page Not Found"
        description="The plant you're looking for doesn't seem to exist here. Try searching or browse our species list."
        action={{ label: 'Search Plants', href: '/search' }}
      />
    </div>
  );
}
