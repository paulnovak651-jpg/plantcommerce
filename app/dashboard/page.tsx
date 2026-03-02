// Command Center — dev-only tool, not linked in public nav.
// Shows agent sessions, task queue, and dropped-session alerts.
// Fetches fresh data on every load (force-dynamic).

import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ── Types ──────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 1 | 2 | 3 | 4;
  project: string;
  assigned_agent: string | null;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AgentSession {
  id: string;
  agent: string;
  project: string;
  task_id: string | null;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'completed' | 'dropped';
  summary: string | null;
  tasks: { title: string } | { title: string }[] | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const C = {
  bg:         '#111',
  surface:    '#1c1c1c',
  surfaceAlt: '#242424',
  border:     '#2e2e2e',
  borderSoft: '#222',
  text:       '#e8e0d4',
  muted:      '#8a8279',
  dim:        '#5c554b',
  green:      '#4a9a6a',
  greenBg:    '#1a2e22',
  amber:      '#c97c2a',
  amberBg:    '#2e2010',
  red:        '#c05050',
  redBg:      '#2e1a1a',
  blue:       '#5a80aa',
  blueBg:     '#1a2030',
  purple:     '#8a70c0',
  purpleBg:   '#201a30',
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function duration(start: string, end: string | null): string {
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1)  return '<1m';
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

const PRIORITY_LABEL: Record<number, string> = { 1: 'CRIT', 2: 'HIGH', 3: 'MED', 4: 'LOW' };
const PRIORITY_COLOR: Record<number, string> = { 1: C.red, 2: C.amber, 3: C.muted, 4: C.dim };

const STATUS_COLOR: Record<string, string> = {
  active:    C.green,
  completed: C.muted,
  dropped:   C.red,
};

const AGENT_COLOR: Record<string, string> = {
  'claude-code':  C.amber,
  'claude-opus':  C.purple,
  'codex':        C.blue,
  'chatgpt':      C.green,
};

function agentColor(agent: string): string {
  return AGENT_COLOR[agent] ?? C.muted;
}

// ── Sub-components (server-renderable) ────────────────────────────────────

function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      padding: '2px 7px', borderRadius: 4,
      color, background: bg, whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: C.muted, margin: 0, textTransform: 'uppercase' }}>
        {title}
      </h2>
      {count !== undefined && (
        <span style={{ fontSize: 11, color: C.dim }}>{count}</span>
      )}
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const priorityColor = PRIORITY_COLOR[task.priority] ?? C.muted;
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6,
      padding: '10px 14px', marginBottom: 6,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <span style={{ fontSize: 9, fontWeight: 700, color: priorityColor, marginTop: 2, minWidth: 28, letterSpacing: '0.05em' }}>
        {PRIORITY_LABEL[task.priority] ?? 'MED'}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, lineHeight: 1.4 }}>
          {task.title}
        </div>
        {task.description && (
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 1.5 }}>
            {task.description}
          </div>
        )}
        {task.notes && (
          <div style={{ fontSize: 11, color: C.amber, marginTop: 4, fontStyle: 'italic' }}>
            {task.notes}
          </div>
        )}
      </div>
      {task.assigned_agent && (
        <span style={{ fontSize: 10, color: agentColor(task.assigned_agent), whiteSpace: 'nowrap' }}>
          {task.assigned_agent}
        </span>
      )}
    </div>
  );
}

function SessionRow({ session, isDropped }: { session: AgentSession; isDropped: boolean }) {
  const taskRef = Array.isArray(session.tasks) ? session.tasks[0] : session.tasks;
  const taskTitle = taskRef?.title ?? (session.task_id ? `task ${session.task_id.slice(0, 8)}` : '—');
  const statusColor = isDropped ? C.red : STATUS_COLOR[session.status] ?? C.muted;
  const statusLabel = isDropped ? 'DROPPED?' : session.status;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '110px 1fr 80px 60px 90px',
      gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.borderSoft}`,
      alignItems: 'center',
    }}>
      <span style={{ fontSize: 12, color: agentColor(session.agent), fontWeight: 500 }}>
        {session.agent}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {taskTitle}
        </div>
        {session.summary && (
          <div style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session.summary}
          </div>
        )}
      </div>
      <span style={{ fontSize: 11, color: C.dim }}>{timeAgo(session.started_at)}</span>
      <span style={{ fontSize: 11, color: C.dim }}>{duration(session.started_at, session.ended_at)}</span>
      <span style={{ fontSize: 10, fontWeight: 700, color: statusColor, letterSpacing: '0.05em' }}>
        {statusLabel.toUpperCase()}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = createServiceClient();

  const [{ data: tasks }, { data: sessions }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true }),
    supabase
      .from('agent_sessions')
      .select('id, agent, project, task_id, started_at, ended_at, status, summary, tasks(title)')
      .order('started_at', { ascending: false })
      .limit(30),
  ]);

  const allTasks   = (tasks ?? []) as Task[];
  const allSessions = (sessions ?? []) as AgentSession[];

  const ONE_HOUR_MS = 60 * 60 * 1000;
  const now = Date.now();

  const inProgress = allTasks.filter((t) => t.status === 'in_progress');
  const todo       = allTasks.filter((t) => t.status === 'todo');
  const done       = allTasks.filter((t) => t.status === 'done');
  const blocked    = allTasks.filter((t) => t.status === 'blocked');

  const activeSessions  = allSessions.filter((s) => s.status === 'active');
  const droppedSessions = activeSessions.filter(
    (s) => now - new Date(s.started_at).getTime() > ONE_HOUR_MS
  );
  const healthySessions = activeSessions.filter(
    (s) => now - new Date(s.started_at).getTime() <= ONE_HOUR_MS
  );

  const nowStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Auto-refresh every 30s ── */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <meta httpEquiv="refresh" content="30" />

      {/* ── Header ── */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Command Center</h1>
            <span style={{ fontSize: 11, color: C.dim }}>PlantCommerce — dev tool</span>
          </div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>
            {allTasks.length} tasks · {activeSessions.length} active session{activeSessions.length !== 1 ? 's' : ''} · refreshes every 30s · last loaded {nowStr}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href="/system-map" style={{ fontSize: 11, color: C.muted, textDecoration: 'none', padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: 5 }}>
            System Map
          </a>
          <a href="/dashboard" style={{ fontSize: 11, color: C.text, textDecoration: 'none', padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: 5 }}>
            Refresh
          </a>
        </div>
      </div>

      <div style={{ padding: '20px 24px', maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Dropped Sessions Alert ── */}
        {droppedSessions.length > 0 && (
          <div style={{ background: C.redBg, border: `1px solid ${C.red}40`, borderLeft: `3px solid ${C.red}`, borderRadius: 6, padding: '14px 18px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.red }}>
                ⚠ {droppedSessions.length} DROPPED SESSION{droppedSessions.length > 1 ? 'S' : ''} DETECTED
              </span>
            </div>
            {droppedSessions.map((s) => {
              const taskRef = Array.isArray(s.tasks) ? s.tasks[0] : s.tasks;
              return (
                <div key={s.id} style={{ marginBottom: 8, paddingLeft: 4 }}>
                  <div style={{ fontSize: 13, color: C.text }}>
                    <span style={{ color: agentColor(s.agent), fontWeight: 600 }}>{s.agent}</span>
                    {taskRef?.title && <> was working on <span style={{ color: C.amber }}>"{taskRef.title}"</span></>}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    Started {timeAgo(s.started_at)} — session ended unexpectedly
                    {s.summary && <> · Last note: "{s.summary}"</>}
                  </div>
                  <div style={{ fontSize: 11, color: C.red, marginTop: 3 }}>
                    → Pick up this task and mark the session dropped:
                    {' '}
                    <code style={{ background: '#1a0808', padding: '1px 6px', borderRadius: 3, fontFamily: 'monospace', fontSize: 10 }}>
                      PATCH /api/dashboard/sessions/{s.id.slice(0, 8)}... &#123;"status":"dropped"&#125;
                    </code>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Active Sessions ── */}
        {healthySessions.length > 0 && (
          <div style={{ background: C.greenBg, border: `1px solid ${C.green}30`, borderLeft: `3px solid ${C.green}`, borderRadius: 6, padding: '12px 18px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 8 }}>
              ● {healthySessions.length} ACTIVE SESSION{healthySessions.length > 1 ? 'S' : ''}
            </div>
            {healthySessions.map((s) => {
              const taskRef = Array.isArray(s.tasks) ? s.tasks[0] : s.tasks;
              return (
                <div key={s.id} style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>
                  <span style={{ color: agentColor(s.agent), fontWeight: 600 }}>{s.agent}</span>
                  {taskRef?.title && <> → <span style={{ color: C.muted }}>{taskRef.title}</span></>}
                  {s.summary && <> · {s.summary}</>}
                  <span style={{ color: C.dim }}> ({timeAgo(s.started_at)})</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Main layout: tasks + session log ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24 }}>

          {/* ── Task Board ── */}
          <div>
            {inProgress.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionHeader title="In Progress" count={inProgress.length} />
                {inProgress.map((t) => <TaskCard key={t.id} task={t} />)}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <SectionHeader title="Todo" count={todo.length} />
              {todo.length === 0 && (
                <div style={{ fontSize: 12, color: C.dim, padding: '8px 0' }}>No pending tasks.</div>
              )}
              {todo.map((t) => <TaskCard key={t.id} task={t} />)}
            </div>

            {blocked.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionHeader title="Blocked" count={blocked.length} />
                {blocked.map((t) => <TaskCard key={t.id} task={t} />)}
              </div>
            )}

            {done.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <SectionHeader title="Done" count={done.length} />
                {done.map((t) => <TaskCard key={t.id} task={t} />)}
              </div>
            )}
          </div>

          {/* ── Right column: session log + how-to ── */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <SectionHeader title="Session Log" count={allSessions.length} />
              {allSessions.length === 0 && (
                <div style={{ fontSize: 12, color: C.dim, padding: '8px 0' }}>No sessions yet.</div>
              )}
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 60px 90px', gap: 12, padding: '4px 0 6px', borderBottom: `1px solid ${C.border}` }}>
                  {['Agent', 'Task / Note', 'When', 'Dur', 'Status'].map((h) => (
                    <span key={h} style={{ fontSize: 9, fontWeight: 700, color: C.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{h}</span>
                  ))}
                </div>
                {allSessions.map((s) => {
                  const isDropped = s.status === 'active' && now - new Date(s.started_at).getTime() > ONE_HOUR_MS;
                  return <SessionRow key={s.id} session={s} isDropped={isDropped} />;
                })}
              </div>
            </div>

            {/* ── How Agents Use This ── */}
            <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                Agent Protocol
              </div>
              <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: C.green }}>1. Session start</span> — register yourself:
                </div>
                <pre style={{ fontSize: 10, background: C.bg, padding: '8px 10px', borderRadius: 4, overflowX: 'auto', color: C.text, margin: '0 0 10px', lineHeight: 1.5 }}>{`curl -X POST /api/dashboard/sessions \\
  -H "Authorization: Bearer $CRON_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"agent":"claude-code",
       "task_id":"<uuid>",
       "summary":"Starting X"}'
# → save the returned id`}</pre>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: C.green }}>2. Session end</span> — mark complete:
                </div>
                <pre style={{ fontSize: 10, background: C.bg, padding: '8px 10px', borderRadius: 4, overflowX: 'auto', color: C.text, margin: '0 0 10px', lineHeight: 1.5 }}>{`curl -X PATCH /api/dashboard/sessions/<id> \\
  -H "Authorization: Bearer $CRON_SECRET" \\
  -H "Content-Type: application/json" \\
  -d '{"status":"completed",
       "summary":"Did X, Y, Z"}'`}</pre>
                <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.6 }}>
                  If you drop without PATCHing, the next session will see this session flagged above and know to pick up your work.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
