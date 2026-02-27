import Link from 'next/link';
import { Surface } from '@/components/ui/Surface';
import { Text } from '@/components/ui/Text';

interface CategoryCardProps {
  category: string;
  speciesCount: number;
  cultivarCount: number;
  nurseryCount: number;
  topSpecies: Array<{ slug: string; canonical_name: string }>;
}

function toCategorySlug(category: string): string {
  return category.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function CategoryCard({
  category,
  speciesCount,
  cultivarCount,
  nurseryCount,
  topSpecies,
}: CategoryCardProps) {
  return (
    <Surface elevation="raised" padding="default" className="h-full">
      <div className="flex h-full flex-col">
        <Text variant="h3">{category}</Text>
        <Text variant="sm" color="secondary" className="mt-1">
          {speciesCount} {speciesCount === 1 ? 'species' : 'species'} · {cultivarCount}{' '}
          {cultivarCount === 1 ? 'cultivar' : 'cultivars'}
        </Text>
        <Text variant="caption" color="tertiary" className="mt-1">
          {nurseryCount} {nurseryCount === 1 ? 'nursery' : 'nurseries'} with stock
        </Text>

        {topSpecies.length > 0 && (
          <ul className="mt-4 space-y-1">
            {topSpecies.map((species) => (
              <li key={species.slug}>
                <Link
                  href={`/plants/${species.slug}`}
                  className="text-sm text-accent hover:text-accent-hover hover:underline"
                >
                  · {species.canonical_name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 pt-2">
          <Link
            href={`/browse?category=${encodeURIComponent(toCategorySlug(category))}`}
            className="text-sm font-medium text-accent hover:text-accent-hover hover:underline"
          >
            Browse all {'->'}
          </Link>
        </div>
      </div>
    </Surface>
  );
}
