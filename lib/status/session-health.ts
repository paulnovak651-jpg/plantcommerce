export const SESSION_HEARTBEAT_INTERVAL_SECONDS = 240;
export const SESSION_STALE_AFTER_MS = 15 * 60 * 1000;

export interface SessionHealthRow {
  status: string;
  started_at: string;
  last_seen_at?: string | null;
}

export function getSessionLastSeenAt(session: SessionHealthRow): string {
  return session.last_seen_at ?? session.started_at;
}

export function isSessionDropped(
  session: SessionHealthRow,
  now = Date.now()
): boolean {
  if (session.status !== 'active') return false;

  return now - new Date(getSessionLastSeenAt(session)).getTime() > SESSION_STALE_AFTER_MS;
}

