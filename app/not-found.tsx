import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-16">
      <Text variant="display" as="p" color="tertiary" className="mb-6 text-[3rem]">
        404
      </Text>
      <EmptyState
        title="Page Not Found"
        description="The plant you're looking for doesn't seem to exist here. Try searching or browse our species list."
        action={{ label: 'Search Plants', href: '/search' }}
      />
    </div>
  );
}
