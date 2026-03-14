import { notFound } from 'next/navigation';
import { SystemMapClient } from './SystemMapClient';

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function SystemMapPage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = sp.token?.trim() ?? '';
  const secret = process.env.ADMIN_STATUS_SECRET ?? process.env.CRON_SECRET;

  if (!secret) notFound();
  if (!token || token !== secret) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#e8e0d4' }}>System Map</h1>
        <p style={{ fontSize: 13, color: '#8a8279', marginTop: 8 }}>
          Unauthorized. Open this page with your admin token:
        </p>
        <pre style={{ fontSize: 12, color: '#5c554b', marginTop: 8 }}>
          /system-map?token=YOUR_ADMIN_STATUS_SECRET
        </pre>
      </div>
    );
  }

  return <SystemMapClient />;
}
