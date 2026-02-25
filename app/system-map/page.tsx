'use client';

// Dev-only system map — not linked in nav.
// Visualizes the PlantCommerce architecture with status, gaps, and priorities.

import { useState } from 'react';

const COLORS = {
  bg: '#1a1a1a',
  card: '#242424',
  border: '#333',
  text: '#e8e0d4',
  textMuted: '#9a9080',
  textDim: '#6b6358',
  accent: '#8B7355',
  green: '#5a8a5a',
  greenBg: '#2a3a2a',
  yellow: '#b89a4a',
  yellowBg: '#3a3428',
  red: '#a85a5a',
  redBg: '#3a2828',
  blue: '#5a7a9a',
  blueBg: '#28303a',
};

const STATUS = {
  live:    { color: COLORS.green,  bg: COLORS.greenBg,  label: 'Live' },
  built:   { color: COLORS.yellow, bg: COLORS.yellowBg, label: 'Built' },
  planned: { color: COLORS.blue,   bg: COLORS.blueBg,   label: 'Planned' },
  missing: { color: COLORS.red,    bg: COLORS.redBg,    label: 'Missing' },
  gap:     { color: COLORS.red,    bg: COLORS.redBg,    label: 'Gap' },
} as const;

type StatusKey = keyof typeof STATUS;

interface MapNode {
  id: string;
  label: string;
  type: string;
  status: StatusKey;
  x: number;
  y: number;
  detail: string;
}

interface MapEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

const nodes: MapNode[] = [
  { id: 'browser',   label: 'User Browser',        type: 'external',  status: 'planned', x: 400, y: 40,  detail: 'No real users yet. Localhost only. Vercel deployment pending.' },
  { id: 'nextjs',    label: 'Next.js 16',           type: 'frontend',  status: 'built',   x: 400, y: 150, detail: 'App Router. Server-rendered pages. "The Field Guide" design system (Fraunces + Satoshi). 7 shared components. Pages: home, search, species, cultivar, nursery index, nursery detail.' },
  { id: 'api',       label: 'API Layer',            type: 'api',       status: 'built',   x: 200, y: 270, detail: '8 endpoints. Consistent response envelope. HATEOAS links. llms.txt + JSON-LD for AI discoverability.' },
  { id: 'pipeline',  label: 'Pipeline Engine',      type: 'pipeline',  status: 'built',   x: 600, y: 270, detail: 'The core engine. Scraper → Parser → Resolver (12-method priority chain) → Writer. Protected cron endpoint. Currently triggered manually only.' },
  { id: 'scraper',   label: 'Scrapers',             type: 'pipeline',  status: 'built',   x: 750, y: 170, detail: 'Burnt Ridge: LIVE (18 offers). Grimo: built, not run. Raintree: needs scraper. One Green World: needs scraper. 6 others: nothing.' },
  { id: 'parser',    label: 'Name Parser',          type: 'pipeline',  status: 'built',   x: 750, y: 270, detail: 'Decomposes raw product names into structured fields. WARNING: hazelnut-specific. Noise terms and botanical patterns are hardcoded. Needs generalization pass for other plant families.' },
  { id: 'resolver',  label: 'Resolver',             type: 'pipeline',  status: 'live',    x: 750, y: 370, detail: '12-method priority chain matching against alias index. Stress-tested with hazelnuts: 104 product names, 100% resolution. Unmatched names go to queue — nobody reviewing them.' },
  { id: 'supabase',  label: 'Supabase PostgreSQL',  type: 'database',  status: 'live',    x: 400, y: 430, detail: 'Project "plantfinder". Core: plant_entities, cultivars, aliases, legal_identifiers. Commerce: nurseries (10), inventory_offers. Pipeline: import_runs, raw_inventory_rows, unmatched_names. Search: material_search_index (materialized view, trigram).' },
  { id: 'unmatched', label: 'Unmatched Queue',      type: 'gap',       status: 'gap',     x: 200, y: 430, detail: 'NO ADMIN UI. Names the resolver cannot match accumulate here. Nobody is reviewing them. Resolution rate across real data: UNKNOWN. This is the biggest operational gap.' },
  { id: 'cron',      label: 'Cron / Scheduler',     type: 'infra',     status: 'missing', x: 600, y: 150, detail: 'Protected cron endpoint exists in code but no actual scheduler is running. Pipeline is manual-trigger only. Needs Vercel Cron.' },
  { id: 'vercel',    label: 'Vercel Hosting',       type: 'infra',     status: 'planned', x: 400, y: 550, detail: 'Not deployed. App lives on localhost only. Deployment is a prerequisite for real users, cron jobs, and any kind of feedback loop.' },
  { id: 'admin',     label: 'Admin UI',             type: 'gap',       status: 'gap',     x: 50,  y: 330, detail: 'Does not exist. Needed for: reviewing unmatched names, monitoring pipeline health, seeing resolution rates, managing nursery scrapers. Without this, the system runs blind.' },
  { id: 'claude',    label: 'Claude Code',          type: 'agent',     status: 'live',    x: 50,  y: 150, detail: 'Persistent memory, Supabase MCP, GitHub MCP. Handles: architecture decisions, reviews, TypeScript issues, DB queries. Updates shared context repo after sessions.' },
  { id: 'codex',     label: 'Codex',                type: 'agent',     status: 'live',    x: 50,  y: 50,  detail: 'Runs locally in project folder. Edits files, pushes to git. Reads AGENTS.md on startup. Handles: scraper implementation, refactoring, UI work.' },
];

const edges: MapEdge[] = [
  { from: 'browser',   to: 'nextjs',    label: 'HTTP' },
  { from: 'nextjs',    to: 'api' },
  { from: 'nextjs',    to: 'supabase',  label: 'Direct queries' },
  { from: 'api',       to: 'supabase' },
  { from: 'api',       to: 'pipeline',  label: 'Trigger' },
  { from: 'pipeline',  to: 'scraper' },
  { from: 'scraper',   to: 'parser',    label: 'Raw HTML' },
  { from: 'parser',    to: 'resolver',  label: 'Structured names' },
  { from: 'resolver',  to: 'supabase',  label: 'Upsert' },
  { from: 'resolver',  to: 'unmatched', label: 'Failures', dashed: true },
  { from: 'cron',      to: 'pipeline',  label: 'Scheduled', dashed: true },
  { from: 'vercel',    to: 'nextjs',    label: 'Deploys', dashed: true },
  { from: 'claude',    to: 'supabase',  label: 'MCP', dashed: true },
  { from: 'codex',     to: 'nextjs',    label: 'Git push', dashed: true },
];

const NODE_W = 140;
const NODE_H = 52;

function NodeBox({ node, isSelected, onClick }: { node: MapNode; isSelected: boolean; onClick: (id: string) => void }) {
  const st = STATUS[node.status];
  return (
    <g onClick={() => onClick(node.id)} style={{ cursor: 'pointer' }} role="button" tabIndex={0}>
      <rect x={node.x} y={node.y} width={NODE_W} height={NODE_H} rx={8}
        fill={isSelected ? st.bg : COLORS.card}
        stroke={isSelected ? st.color : COLORS.border}
        strokeWidth={isSelected ? 2 : 1}
      />
      <circle cx={node.x + 16} cy={node.y + 18} r={5} fill={st.color} />
      <text x={node.x + 28} y={node.y + 22} fill={COLORS.text} fontSize={12} fontWeight={600} fontFamily="system-ui, sans-serif">
        {node.label}
      </text>
      <text x={node.x + 28} y={node.y + 38} fill={COLORS.textDim} fontSize={10} fontFamily="system-ui, sans-serif">
        {st.label}
      </text>
    </g>
  );
}

function EdgeLine({ fromNode, toNode, label, dashed }: { fromNode: MapNode; toNode: MapNode; label?: string; dashed?: boolean }) {
  const fx = fromNode.x + NODE_W / 2;
  const fy = fromNode.y + NODE_H / 2;
  const tx = toNode.x + NODE_W / 2;
  const ty = toNode.y + NODE_H / 2;
  return (
    <g>
      <line x1={fx} y1={fy} x2={tx} y2={ty} stroke={COLORS.border} strokeWidth={1}
        strokeDasharray={dashed ? '4 4' : undefined} opacity={0.5}
      />
      {label && (
        <text x={(fx + tx) / 2} y={(fy + ty) / 2 - 4} fill={COLORS.textDim} fontSize={9} textAnchor="middle" fontFamily="system-ui, sans-serif">
          {label}
        </text>
      )}
    </g>
  );
}

const priorities = [
  { num: 1, title: 'Deploy to Vercel',                  why: 'Everything else is blocked by being localhost-only. No real users, no cron, no feedback.', effort: 'Low' },
  { num: 2, title: 'Build Admin UI for Unmatched Queue', why: "Flying blind on data quality. Need to see what the resolver misses and fix it.",           effort: 'Medium' },
  { num: 3, title: 'Run Grimo scraper live',             why: 'Second nursery validates the pipeline works across sources. Built but untested.',          effort: 'Low' },
  { num: 4, title: 'Set up Vercel Cron',                 why: 'Pipeline needs to run automatically. Manual triggers do not scale.',                       effort: 'Low' },
  { num: 5, title: 'Generalize the parser',              why: 'Hazelnut-specific hardcoding blocks expansion to other plant families.',                    effort: 'High' },
  { num: 6, title: 'Build remaining scrapers',           why: 'Raintree, One Green World, and 6 others. More data = more useful platform.',               effort: 'Medium' },
];

export default function SystemMapPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'gaps' | 'priorities'>('map');

  const selectedNode = nodes.find((n) => n.id === selected);
  const gaps = nodes.filter((n) => n.status === 'gap' || n.status === 'missing');

  return (
    <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>PlantCommerce</h1>
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>System Map — dev tool</span>
        </div>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: '4px 0 12px' }}>
          Click any node to see details. Dashed lines = not yet connected.
        </p>
        <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
          {(['map', 'gaps', 'priorities'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '8px 16px', fontSize: 12, fontWeight: view === v ? 600 : 400,
              background: view === v ? COLORS.card : 'transparent',
              color: view === v ? COLORS.text : COLORS.textMuted,
              border: `1px solid ${view === v ? COLORS.border : 'transparent'}`,
              borderBottom: view === v ? `1px solid ${COLORS.bg}` : `1px solid ${COLORS.border}`,
              borderRadius: '6px 6px 0 0', cursor: 'pointer', marginBottom: -1,
              position: 'relative', zIndex: view === v ? 1 : 0,
            }}>
              {v === 'map' ? 'System Map' : v === 'gaps' ? 'Gaps & Risks' : 'Priorities'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {view === 'map' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 auto', minWidth: 500 }}>
              <svg width="860" height="620" viewBox="0 0 860 620">
                {Object.entries(STATUS).map(([key, val], i) => (
                  <g key={key} transform={`translate(${10 + i * 90}, 590)`}>
                    <circle cx={6} cy={6} r={5} fill={val.color} />
                    <text x={16} y={10} fill={COLORS.textDim} fontSize={10} fontFamily="system-ui">{val.label}</text>
                  </g>
                ))}
                {edges.map((e, i) => {
                  const fromNode = nodes.find((n) => n.id === e.from);
                  const toNode = nodes.find((n) => n.id === e.to);
                  if (!fromNode || !toNode) return null;
                  return <EdgeLine key={i} fromNode={fromNode} toNode={toNode} label={e.label} dashed={e.dashed} />;
                })}
                {nodes.map((node) => (
                  <NodeBox key={node.id} node={node} isSelected={selected === node.id} onClick={setSelected} />
                ))}
              </svg>
            </div>
            <div style={{ width: 280, flexShrink: 0 }}>
              {selectedNode ? (
                <div style={{ background: COLORS.card, border: `1px solid ${STATUS[selectedNode.status].color}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: STATUS[selectedNode.status].color }} />
                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{selectedNode.label}</h3>
                  </div>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: STATUS[selectedNode.status].bg, color: STATUS[selectedNode.status].color, display: 'inline-block', marginBottom: 12 }}>
                    {STATUS[selectedNode.status].label}
                  </span>
                  <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>{selectedNode.detail}</p>
                </div>
              ) : (
                <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16 }}>
                  <p style={{ fontSize: 13, color: COLORS.textDim, margin: 0, textAlign: 'center' }}>← Click a node to see details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'gaps' && (
          <div style={{ maxWidth: 640 }}>
            {gaps.map((node) => {
              const st = STATUS[node.status];
              return (
                <div key={node.id} style={{ background: st.bg, border: `1px solid ${st.color}40`, borderRadius: 8, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: st.color }} />
                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{node.label}</h3>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: `${st.color}20`, color: st.color, marginLeft: 'auto' }}>{st.label}</span>
                  </div>
                  <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6, margin: 0 }}>{node.detail}</p>
                </div>
              );
            })}
          </div>
        )}

        {view === 'priorities' && (
          <div style={{ maxWidth: 640 }}>
            {priorities.map((p) => (
              <div key={p.num} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginBottom: 8, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: COLORS.accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {p.num}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{p.title}</h3>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: p.effort === 'Low' ? COLORS.greenBg : p.effort === 'High' ? COLORS.redBg : COLORS.yellowBg, color: p.effort === 'Low' ? COLORS.green : p.effort === 'High' ? COLORS.red : COLORS.yellow }}>
                      {p.effort}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.5, margin: 0 }}>{p.why}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
