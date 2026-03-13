import Link from 'next/link';

interface PollinationVisualProps {
  sAlleles: string[];
  compatiblePartners: { name: string; slug: string }[];
  incompatiblePartners: { name: string; slug: string }[];
  pollinationMechanism: string;
  speciesSlug: string;
  maxPollinatorDistance?: number;
}

export function PollinationVisual({
  sAlleles,
  compatiblePartners,
  incompatiblePartners,
  pollinationMechanism,
  speciesSlug,
  maxPollinatorDistance,
}: PollinationVisualProps) {
  const hasData = sAlleles.length > 0 || compatiblePartners.length > 0 || incompatiblePartners.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-primary px-6 py-8 text-center">
        <p className="text-sm font-medium text-text-primary">Pollination data coming soon</p>
        <p className="mt-1 text-xs text-text-tertiary">
          <Link href={`/pollination/${speciesSlug}`} className="text-accent hover:underline">
            View species pollination guide &rarr;
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mechanism and distance */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-inset px-3 py-1 text-xs font-medium text-text-secondary">
          {pollinationMechanism.replace(/_/g, ' ')}
        </span>
        {maxPollinatorDistance != null && (
          <span className="text-xs text-text-tertiary">
            Max distance: {maxPollinatorDistance} ft
          </span>
        )}
      </div>

      {/* S-allele badges */}
      {sAlleles.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">S-Alleles</p>
          <div className="flex flex-wrap gap-1.5">
            {sAlleles.map((allele) => (
              <span
                key={allele}
                className="rounded-full border border-border-subtle bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-text-primary"
              >
                {allele}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Compatible partners */}
      {compatiblePartners.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Good Partners</p>
          <div className="flex flex-wrap gap-1.5">
            {compatiblePartners.map((partner) => (
              <Link
                key={partner.slug}
                href={`/plants/${speciesSlug}/${partner.slug}`}
                className="rounded-full bg-accent-light border border-accent-subtle px-2.5 py-0.5 text-xs font-medium text-accent hover:bg-accent-subtle transition-colors"
              >
                {partner.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Incompatible partners */}
      {incompatiblePartners.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Incompatible</p>
          <div className="flex flex-wrap gap-1.5">
            {incompatiblePartners.map((partner) => (
              <Link
                key={partner.slug}
                href={`/plants/${speciesSlug}/${partner.slug}`}
                className="rounded-full bg-red-50 border border-red-200 px-2.5 py-0.5 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
              >
                {partner.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
