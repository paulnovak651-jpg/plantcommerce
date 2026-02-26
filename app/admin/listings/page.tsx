import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServiceClient } from '@/lib/supabase/server';
import { getListingsForAdmin } from '@/lib/queries/listings';
import type { AdminListing } from '@/lib/queries/listings';
import { Text } from '@/components/ui/Text';
import { Surface } from '@/components/ui/Surface';
import { Tag } from '@/components/ui/Tag';
import { updateListingStatusAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin — Listings',
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ token?: string; status?: string }>;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPrice(priceCents: number | null): string {
  if (priceCents === null) return 'Trade/Free';
  if (priceCents === 0) return 'Free';
  return `$${(priceCents / 100).toFixed(2)}`;
}

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'all'] as const;

function statusTagType(status: string): 'availability' | 'neutral' | 'community' {
  if (status === 'approved') return 'availability';
  if (status === 'rejected') return 'community';
  return 'neutral';
}

export default async function AdminListingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = sp.token?.trim() ?? '';
  const secret = process.env.ADMIN_STATUS_SECRET ?? process.env.CRON_SECRET;

  if (!secret) notFound();

  if (!token || token !== secret) {
    return (
      <div className="space-y-4">
        <Text variant="h1">Admin — Listings</Text>
        <Surface elevation="raised" padding="default">
          <Text variant="body" color="secondary">
            Unauthorized. Open this page with your admin token:
          </Text>
          <pre className="mt-3 overflow-x-auto rounded bg-surface-inset p-3 text-xs text-text-secondary">
            /admin/listings?token=YOUR_ADMIN_STATUS_SECRET
          </pre>
        </Surface>
      </div>
    );
  }

  const statusFilter = STATUS_OPTIONS.includes(sp.status as typeof STATUS_OPTIONS[number])
    ? (sp.status as string)
    : 'pending';

  const supabase = createServiceClient();
  const [listings, { count: pendingCount }, { count: approvedCount }, { count: rejectedCount }] =
    await Promise.all([
      getListingsForAdmin(supabase, statusFilter),
      supabase
        .from('community_listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('community_listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved'),
      supabase
        .from('community_listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'rejected'),
    ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text variant="h1">Admin — Listings</Text>
          <Text variant="sm" color="secondary">
            Moderate community WTS/WTB listings.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Tag type="neutral">pending: {pendingCount ?? 0}</Tag>
          <Tag type="availability">approved: {approvedCount ?? 0}</Tag>
          <Tag type="community">rejected: {rejectedCount ?? 0}</Tag>
        </div>
      </section>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {STATUS_OPTIONS.map((s) => (
          <Link
            key={s}
            href={`/admin/listings?token=${encodeURIComponent(token)}&status=${s}`}
            className={`rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-accent text-text-inverse'
                : 'bg-surface-raised text-text-secondary hover:text-accent'
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {listings.length === 0 && (
          <Surface elevation="raised" padding="default">
            <Text variant="body" color="secondary">
              No listings with status &ldquo;{statusFilter}&rdquo;.
            </Text>
          </Surface>
        )}

        {listings.map((listing: AdminListing) => {
          const resolvedName =
            listing.cultivars?.canonical_name ?? listing.plant_entities?.canonical_name;
          const cultivarSlug = listing.cultivars?.slug;
          const speciesSlug =
            (listing.cultivars as { plant_entity_id?: string } | null)
              ?.plant_entity_id ?? listing.plant_entities?.slug;

          return (
            <Surface key={listing.id} elevation="raised" padding="default">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        listing.listing_type === 'wts'
                          ? 'bg-accent-light text-status-active'
                          : 'bg-accent-subtle text-accent'
                      }`}
                    >
                      {listing.listing_type.toUpperCase()}
                    </span>
                    <Tag type={statusTagType(listing.status)}>{listing.status}</Tag>
                    {listing.resolve_confidence != null &&
                      listing.resolve_confidence > 0 && (
                        <Tag type="neutral">
                          resolved {Math.round(listing.resolve_confidence * 100)}%
                        </Tag>
                      )}
                  </div>
                  <Text variant="h3">
                    &ldquo;{listing.raw_cultivar_text}&rdquo;
                    {resolvedName && resolvedName !== listing.raw_cultivar_text && (
                      <span className="ml-2 text-sm font-normal text-status-active">
                        → {resolvedName}
                      </span>
                    )}
                  </Text>
                  <Text variant="sm" color="secondary">
                    {listing.material_type} · qty {listing.quantity ?? '?'} ·{' '}
                    {formatPrice(listing.price_cents)} · {listing.location_state}
                  </Text>
                  {listing.notes && (
                    <Text variant="caption" color="tertiary">
                      {listing.notes}
                    </Text>
                  )}
                  <Text variant="caption" color="tertiary">
                    Submitted {fmtDate(listing.created_at)}
                    {listing.contact_email && ` · ${listing.contact_email}`}
                  </Text>
                  {listing.mod_reason && (
                    <Text variant="caption" color="tertiary">
                      Mod note: {listing.mod_reason}
                    </Text>
                  )}
                </div>
                <div className="flex gap-2">
                  {cultivarSlug && speciesSlug && (
                    <Link
                      href={`/plants/${speciesSlug}/${cultivarSlug}`}
                      className="text-sm text-accent hover:underline"
                    >
                      View cultivar
                    </Link>
                  )}
                </div>
              </div>

              {/* Moderation actions */}
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <form action={updateListingStatusAction} className="space-y-2">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="id" value={listing.id} />
                  <input type="hidden" name="status" value="approved" />
                  <label className="block text-xs text-text-secondary">
                    Note (optional)
                    <textarea
                      name="mod_reason"
                      defaultValue={listing.mod_reason ?? ''}
                      rows={2}
                      className="mt-1 w-full rounded border border-border bg-surface-primary px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded bg-accent px-3 py-2 text-sm text-white"
                  >
                    Approve
                  </button>
                </form>

                <form action={updateListingStatusAction} className="space-y-2">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="id" value={listing.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <label className="block text-xs text-text-secondary">
                    Rejection reason
                    <textarea
                      name="mod_reason"
                      defaultValue={listing.mod_reason ?? ''}
                      rows={2}
                      className="mt-1 w-full rounded border border-border bg-surface-primary px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded bg-surface-inset px-3 py-2 text-sm text-text-primary"
                  >
                    Reject
                  </button>
                </form>

                <form action={updateListingStatusAction} className="space-y-2">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="id" value={listing.id} />
                  <input type="hidden" name="status" value="pending" />
                  <label className="block text-xs text-text-secondary">
                    Note (optional)
                    <textarea
                      name="mod_reason"
                      defaultValue={listing.mod_reason ?? ''}
                      rows={2}
                      className="mt-1 w-full rounded border border-border bg-surface-primary px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded bg-surface-inset px-3 py-2 text-sm text-text-primary"
                  >
                    Reset to Pending
                  </button>
                </form>
              </div>
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
