import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/server';
import { Text } from '@/components/ui/Text';
import { Surface } from '@/components/ui/Surface';
import { Tag } from '@/components/ui/Tag';
import { parseLimit, parseListStatus } from '@/lib/unmatched/admin';
import { updateUnmatchedAction } from './actions';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{
    token?: string;
    status?: string;
    limit?: string;
  }>;
}

interface NurseryRef {
  name?: string | null;
  slug?: string | null;
}

interface UnmatchedRow {
  id: string;
  raw_product_name: string;
  parsed_core_name: string;
  nursery_id: string;
  review_status: 'pending' | 'resolved' | 'ignored';
  resolved_to_type: string | null;
  resolved_to_id: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
  occurrence_count: number | null;
  first_seen_at: string;
  last_seen_at: string;
  nurseries: NurseryRef | NurseryRef[] | null;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Admin Unmatched Queue',
    robots: { index: false, follow: false },
  };
}

function getNursery(nurseries: UnmatchedRow['nurseries']): NurseryRef | null {
  if (!nurseries) return null;
  if (Array.isArray(nurseries)) return nurseries[0] ?? null;
  return nurseries;
}

function fmtDate(iso: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
}

export default async function AdminUnmatchedPage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = sp.token?.trim() ?? '';
  const secret = process.env.ADMIN_STATUS_SECRET ?? process.env.CRON_SECRET;

  if (!secret) notFound();

  if (!token || token !== secret) {
    return (
      <div className="space-y-4">
        <Text variant="h1">Admin Unmatched Queue</Text>
        <Surface elevation="raised" padding="default">
          <Text variant="body" color="secondary">
            Unauthorized. Open this page with your admin token:
          </Text>
          <pre className="mt-3 overflow-x-auto rounded bg-surface-inset p-3 text-xs text-text-secondary">
            /admin/unmatched?token=YOUR_ADMIN_STATUS_SECRET
          </pre>
        </Surface>
      </div>
    );
  }

  const status = parseListStatus(sp.status ?? null);
  const limit = parseLimit(sp.limit ?? null, 100);
  const supabase = createServiceClient();

  let query = supabase
    .from('unmatched_names')
    .select(
      'id, raw_product_name, parsed_core_name, nursery_id, review_status, resolved_to_type, resolved_to_id, reviewed_at, reviewer_notes, occurrence_count, first_seen_at, last_seen_at, nurseries(name, slug)',
      { count: 'exact' }
    )
    .order('last_seen_at', { ascending: false })
    .limit(limit);

  if (status !== 'all') {
    query = query.eq('review_status', status);
  }

  const [{ data: rows, count }, { count: pendingCount }, { count: resolvedCount }, { count: ignoredCount }] =
    await Promise.all([
      query,
      supabase
        .from('unmatched_names')
        .select('id', { count: 'exact', head: true })
        .eq('review_status', 'pending'),
      supabase
        .from('unmatched_names')
        .select('id', { count: 'exact', head: true })
        .eq('review_status', 'resolved'),
      supabase
        .from('unmatched_names')
        .select('id', { count: 'exact', head: true })
        .eq('review_status', 'ignored'),
    ]);

  const unmatchedRows = (rows ?? []) as UnmatchedRow[];

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Text variant="h1">Admin Unmatched Queue</Text>
          <Text variant="sm" color="secondary">
            Review unresolved names from scraper pipeline.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Tag type="neutral">pending: {pendingCount ?? 0}</Tag>
          <Tag type="neutral">resolved: {resolvedCount ?? 0}</Tag>
          <Tag type="neutral">ignored: {ignoredCount ?? 0}</Tag>
        </div>
      </section>

      <Surface elevation="raised" padding="default">
        <form method="GET" className="flex flex-wrap items-end gap-3">
          <input type="hidden" name="token" value={token} />
          <label className="text-xs text-text-secondary">
            Status
            <select
              name="status"
              defaultValue={status}
              className="mt-1 block rounded border border-border bg-surface-primary px-2 py-1 text-sm"
            >
              <option value="all">all</option>
              <option value="pending">pending</option>
              <option value="resolved">resolved</option>
              <option value="ignored">ignored</option>
            </select>
          </label>
          <label className="text-xs text-text-secondary">
            Limit
            <input
              type="number"
              min={1}
              max={500}
              name="limit"
              defaultValue={String(limit)}
              className="mt-1 block w-24 rounded border border-border bg-surface-primary px-2 py-1 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-accent px-3 py-2 text-sm text-white"
          >
            Apply
          </button>
          <Text variant="caption" color="tertiary">
            Showing {unmatchedRows.length} of {count ?? unmatchedRows.length}
          </Text>
        </form>
      </Surface>

      <div className="space-y-3">
        {unmatchedRows.length === 0 && (
          <Surface elevation="raised" padding="default">
            <Text variant="body" color="secondary">
              No unmatched rows for this filter.
            </Text>
          </Surface>
        )}

        {unmatchedRows.map((row) => {
          const nursery = getNursery(row.nurseries);
          return (
            <Surface key={row.id} elevation="raised" padding="default">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <Text variant="h3">{row.raw_product_name}</Text>
                  <Text variant="sm" color="secondary">
                    parsed core: {row.parsed_core_name}
                  </Text>
                  <Text variant="caption" color="tertiary">
                    nursery: {nursery?.name ?? row.nursery_id ?? 'unknown'} · seen:{' '}
                    {row.occurrence_count ?? 0} · first: {fmtDate(row.first_seen_at)} · last:{' '}
                    {fmtDate(row.last_seen_at)}
                  </Text>
                </div>

                <div className="flex items-center gap-2">
                  <Tag type="neutral">{row.review_status}</Tag>
                  <Link
                    href={`/search?q=${encodeURIComponent(row.parsed_core_name)}`}
                    className="text-sm text-accent hover:underline"
                  >
                    Search
                  </Link>
                  {nursery?.slug && (
                    <Link
                      href={`/nurseries/${nursery.slug}`}
                      className="text-sm text-accent hover:underline"
                    >
                      Nursery
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-3">
                <form action={updateUnmatchedAction} className="space-y-2">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="review_status" value="ignored" />
                  <label className="block text-xs text-text-secondary">
                    Notes (optional)
                    <textarea
                      name="reviewer_notes"
                      defaultValue={row.reviewer_notes ?? ''}
                      rows={2}
                      className="mt-1 w-full rounded border border-border bg-surface-primary px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded bg-surface-inset px-3 py-2 text-sm text-text-primary"
                  >
                    Mark Ignored
                  </button>
                </form>

                <form action={updateUnmatchedAction} className="space-y-2">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="review_status" value="pending" />
                  <label className="block text-xs text-text-secondary">
                    Notes (optional)
                    <textarea
                      name="reviewer_notes"
                      defaultValue={row.reviewer_notes ?? ''}
                      rows={2}
                      className="mt-1 w-full rounded border border-border bg-surface-primary px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded bg-surface-inset px-3 py-2 text-sm text-text-primary"
                  >
                    Reopen Pending
                  </button>
                </form>

                <form action={updateUnmatchedAction} className="space-y-2">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="review_status" value="resolved" />
                  <label className="block text-xs text-text-secondary">
                    Resolved type
                    <select
                      name="resolved_to_type"
                      defaultValue={row.resolved_to_type ?? 'cultivar'}
                      className="mt-1 w-full rounded border border-border bg-surface-primary px-2 py-1 text-sm"
                    >
                      <option value="cultivar">cultivar</option>
                      <option value="plant_entity">plant_entity</option>
                      <option value="named_material">named_material</option>
                      <option value="population">population</option>
                    </select>
                  </label>
                  <label className="block text-xs text-text-secondary">
                    Resolved ID
                    <input
                      name="resolved_to_id"
                      defaultValue={row.resolved_to_id ?? ''}
                      placeholder="UUID"
                      className="mt-1 w-full rounded border border-border bg-surface-primary px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="block text-xs text-text-secondary">
                    Notes (optional)
                    <textarea
                      name="reviewer_notes"
                      defaultValue={row.reviewer_notes ?? ''}
                      rows={2}
                      className="mt-1 w-full rounded border border-border bg-surface-primary px-2 py-1 text-sm"
                    />
                  </label>
                  <button
                    type="submit"
                    className="rounded bg-accent px-3 py-2 text-sm text-white"
                  >
                    Mark Resolved
                  </button>
                </form>
              </div>

              {(row.resolved_to_id || row.reviewed_at) && (
                <div className="mt-2">
                  <Text variant="caption" color="tertiary">
                    reviewed at: {fmtDate(row.reviewed_at)} · resolved:{' '}
                    {row.resolved_to_type ?? '-'} / {row.resolved_to_id ?? '-'}
                  </Text>
                </div>
              )}
            </Surface>
          );
        })}
      </div>
    </div>
  );
}
