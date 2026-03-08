'use client';

import dynamic from 'next/dynamic';
import type { NurseryPin } from './NurseryMapClient';

export type { NurseryPin };

const NurseryMapClient = dynamic(
  () => import('./NurseryMapClient').then((m) => m.NurseryMapClient),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse rounded-[var(--radius-lg)] bg-surface-raised"
        style={{ height: '100%', width: '100%', minHeight: '300px' }}
      />
    ),
  }
);

export function NurseryMap({
  nurseries,
  height = '300px',
}: {
  nurseries: NurseryPin[];
  height?: string;
}) {
  return (
    <div style={{ height, width: '100%' }}>
      <NurseryMapClient nurseries={nurseries} height={height} />
    </div>
  );
}
