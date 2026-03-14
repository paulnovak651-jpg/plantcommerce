'use client';

// Dev-only system map — not linked in nav.
// Visualizes the PlantCommerce architecture with status, gaps, and priorities.
// Last updated: 2026-03-01

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
  { id: 'browser',   label: 'User Browser',        type: 'external',  status: 'live',    x: 400, y: 40,  detail: 'Live on Vercel at plantfinder-cyan.vercel.app. Public-facing. Search, browse, species/cultivar pages, nursery pages, marketplace all accessible.' },
  { id: 'nextjs',    label: 'Next.js 16',           type: 'frontend',  status: 'live',    x: 400, y: 150, detail: 'App Router + Turbopack. Server-rendered. "The Field Guide" design system (Fraunces + Satoshi). Routes: home, search, browse (explorer), species, cultivar, nurseries, marketplace, pollination, listings. 25 components. 99 tests passing. TypeScript strict.' },
  { id: 'api',       label: 'API Layer',            type: 'api',       status: 'live',    x: 200, y: 270, detail: '33 API routes. Consistent response envelope with HATEOAS links. Sparse fieldsets + pagination. llms.txt + JSON-LD for AI discoverability. RSS feed. Sitemap + robots.txt generation.' },
  { id: 'pipeline',  label: 'Pipeline Engine',      type: 'pipeline',  status: 'live',    x: 600, y: 270, detail: 'Scraper → Parser → Resolver (12-method priority chain) → Writer. Protected cron endpoint. Structured JSON logging with duration tracking. Health metrics endpoint. 72 raw inventory rows processed, 38 offers live.' },
  { id: 'scraper',   label: 'Scrapers',             type: 'pipeline',  status: 'built',   x: 750, y: 170, detail: 'Burnt Ridge: LIVE (18 offers). Grimo: built + validated (28 offers). Raintree: built + validated. Rate-limiting, retry logic, user-agent rotation. 7 other nurseries in DB with no scrapers yet.' },
  { id: 'parser',    label: 'Name Parser',          type: 'pipeline',  status: 'built',   x: 750, y: 270, detail: 'Decomposes raw product names into: core name, botanical name, propagation method, sale form, organic status, patent info, trademark, age/size, marketing text. Config-driven genus registry exists but hazelnut patterns dominate. Generalization needed for other families.' },
  { id: 'resolver',  label: 'Resolver',             type: 'pipeline',  status: 'live',    x: 750, y: 370, detail: '12-method priority chain: direct → strip_the → add_the → botanical_fallback → botanical_match → raw_match → species_keyword → generic_default → word_match → bigram → trigram → none. 100% hazelnut resolution. Only 1 unmatched name in queue.' },
  { id: 'supabase',  label: 'Supabase DB',          type: 'database',  status: 'live',    x: 400, y: 430, detail: 'Project "plantfinder" (us-west-2, PG 17.6). 33 tables. Core: 84 plant_entities, 61 cultivars, 38 taxonomy nodes, 20 aliases across 14 genera. Commerce: 10 nurseries, 38 offers. Search: materialized view with trigram + zone expansion. 34 migrations applied.' },
  { id: 'explorer',  label: 'Explorer / Browse',    type: 'frontend',  status: 'live',    x: 50,  y: 270, detail: '/browse page. FilterBar (zone/category/availability) + interactive Cladogram (genus → species → cultivars) with mini zone bars and cultivar counts. Detail panel on selection. Server + client shell architecture.' },
  { id: 'marketplace', label: 'Marketplace',        type: 'frontend',  status: 'built',   x: 200, y: 150, detail: 'Community listings: submission form, moderation queue at /admin/listings, API endpoints, RLS policies. Currently 0 listings — no real community users yet.' },
  { id: 'unmatched', label: 'Unmatched Queue',      type: 'gap',       status: 'gap',     x: 200, y: 430, detail: 'Admin API exists at /admin/unmatched. Only 1 unmatched name currently. But NO admin UI — reviewing requires API calls. Need a simple review page.' },
  { id: 'rls',       label: 'RLS Security',         type: 'gap',       status: 'gap',     x: 200, y: 550, detail: 'CRITICAL: 15 tables have NO Row Level Security. Anyone with the anon key can read/write: plants, suppliers, supplier_listings, rootstocks, dashboard tables, zip_zones, price_history, and more. 3 tables have RLS enabled but zero policies (effectively blocking all access). 6 functions have mutable search paths.' },
  { id: 'vercel',    label: 'Vercel Hosting',       type: 'infra',     status: 'live',    x: 400, y: 550, detail: 'Deployed at plantfinder-cyan.vercel.app. Vercel Cron registered (Monday 6am UTC). CI/CD via GitHub Actions.' },
  { id: 'admin',     label: 'Admin UI',             type: 'gap',       status: 'gap',     x: 50,  y: 430, detail: 'Partial. /admin/listings exists for community listing moderation. /admin/unmatched API exists but no UI page. Missing: pipeline health dashboard, resolution rate monitoring, nursery scraper management.' },
  { id: 'claude',    label: 'Claude Code',          type: 'agent',     status: 'live',    x: 50,  y: 150, detail: 'Persistent memory, Supabase MCP, GitHub MCP. Handles: architecture, reviews, TypeScript, DB queries. Updates shared context. Connected to Command Center dashboard.' },
  { id: 'codex',     label: 'Codex',                type: 'agent',     status: 'live',    x: 50,  y: 50,  detail: 'Runs locally. Edits files, pushes to git. Reads AGENTS.md on startup. Handles: scraper implementation, refactoring, UI work, genus migrations.' },
];

const edges: MapEdge[] = [
  { from: 'browser',     to: 'nextjs',    label: 'HTTP' },
  { from: 'nextjs',      to: 'api' },
  { from: 'nextjs',      to: 'supabase',  label: 'Direct queries' },
  { from: 'nextjs',      to: 'explorer' },
  { from: 'nextjs',      to: 'marketplace' },
  { from: 'api',         to: 'supabase' },
  { from: 'api',         to: 'pipeline',  label: 'Trigger' },
  { from: 'pipeline',    to: 'scraper' },
  { from: 'scraper',     to: 'parser',    label: 'Raw HTML' },
  { from: 'parser',      to: 'resolver',  label: 'Structured names' },
  { from: 'resolver',    to: 'supabase',  label: 'Upsert' },
  { from: 'resolver',    to: 'unmatched', label: 'Failures', dashed: true },
  { from: 'vercel',      to: 'nextjs',    label: 'Hosts' },
  { from: 'vercel',      to: 'pipeline',  label: 'Cron trigger' },
  { from: 'claude',      to: 'supabase',  label: 'MCP', dashed: true },
  { from: 'codex',       to: 'nextjs',    label: 'Git push', dashed: true },
  { from: 'supabase',    to: 'rls',       label: '15 tables exposed', dashed: true },
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
  { num: 1, title: 'Fix RLS security on 15 exposed tables',   why: 'Anyone with the anon key can read/write plants, suppliers, dashboard tables, and more. Critical before real traffic grows.',                  effort: 'Medium' },
  { num: 2, title: 'Build Admin UI for unmatched queue',       why: 'API exists but no page to review unmatched names. Need visibility into data quality as more scrapers come online.',                          effort: 'Medium' },
  { num: 3, title: 'Run Grimo + Raintree scrapers live',       why: 'Both scrapers are built and validated but never run against production. Will triple the inventory data.',                                    effort: 'Low' },
  { num: 4, title: 'Generalize parser beyond hazelnuts',       why: 'Parser noise terms and botanical patterns are hazelnut-heavy. 14 genera in DB but parser only optimized for Corylus.',                      effort: 'High' },
  { num: 5, title: 'Clean up 37 unused database indexes',      why: 'Performance drag on writes. Plus 12 unindexed foreign keys that slow JOINs. Quick cleanup.',                                               effort: 'Low' },
  { num: 6, title: 'Build remaining nursery scrapers',         why: '7 nurseries in DB with no scrapers. More data = more useful platform. Consent-first outreach needed.',                                      effort: 'Medium' },
  { num: 7, title: 'Commit 7 untracked genus research docs',   why: 'Diospyros, Ficus, Morus, Quercus, Sambucus, Vaccinium, Vitis research files sitting uncommitted.',                                         effort: 'Low' },
];

// Stats for the header
const stats = {
  entities: 84,
  cultivars: 61,
  genera: 14,
  nurseries: 10,
  offers: 38,
  tables: 33,
  tests: 99,
  migrations: 34,
};

export function SystemMapClient() {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'map' | 'gaps' | 'priorities' | 'stats'>('map');

  const selectedNode = nodes.find((n) => n.id === selected);
  const gaps = nodes.filter((n) => n.status === 'gap' || n.status === 'missing');

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div style={{ background: COLORS.bg, minHeight: '100vh', color: COLORS.text, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '20px 24px 0', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>PlantCommerce</h1>
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>System Map — dev tool</span>
          <span style={{ fontSize: 10, color: COLORS.textDim, marginLeft: 'auto' }}>Updated 2026-03-01</span>
        </div>
        <p style={{ fontSize: 13, color: COLORS.textMuted, margin: '4px 0 12px' }}>
          Click any node to see details. Dashed lines = not yet connected or flagged.
        </p>
        <div style={{ display: 'flex', gap: 0, marginBottom: 0 }}>
          {(['map', 'gaps', 'priorities', 'stats'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '8px 16px', fontSize: 12, fontWeight: view === v ? 600 : 400,
              background: view === v ? COLORS.card : 'transparent',
              color: view === v ? COLORS.text : COLORS.textMuted,
              border: `1px solid ${view === v ? COLORS.border : 'transparent'}`,
              borderBottom: view === v ? `1px solid ${COLORS.bg}` : `1px solid ${COLORS.border}`,
              borderRadius: '6px 6px 0 0', cursor: 'pointer', marginBottom: -1,
              position: 'relative', zIndex: view === v ? 1 : 0,
            }}>
              {v === 'map' ? 'System Map' : v === 'gaps' ? 'Gaps & Risks' : v === 'priorities' ? 'Priorities' : 'Stats'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>
        {view === 'map' && (
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 auto', minWidth: 500 }}>
              <svg width="860" height="640" viewBox="0 0 860 640">
                {Object.entries(STATUS).map(([key, val], i) => (
                  <g key={key} transform={`translate(${10 + i * 90}, 610)`}>
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
            {gaps.length === 0 ? (
              <p style={{ fontSize: 14, color: COLORS.textMuted }}>No gaps or missing components.</p>
            ) : gaps.map((node) => {
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

        {view === 'stats' && (
          <div style={{ maxWidth: 640 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {Object.entries(stats).map(([key, val]) => (
                <div key={key} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '16px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, letterSpacing: '-0.02em' }}>{val}</div>
                  <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>{key}</div>
                </div>
              ))}
            </div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Data by Genus</h3>
              <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.8 }}>
                Castanea (chestnut) · Juglans (walnut) · Carya (hickory) · Asimina (pawpaw) · Corylus (hazelnut) · Malus (apple) · Prunus (stone fruit) · Pyrus (pear) · Diospyros (persimmon) · Morus (mulberry) · Quercus (oak) · Vaccinium (blueberry) · Sambucus (elderberry) · Vitis (grape) · Ficus (fig)
              </div>
            </div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 16, marginTop: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Nurseries (10)</h3>
              <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.8 }}>
                <span style={{ color: COLORS.green }}>●</span> Burnt Ridge (18 offers live) · <span style={{ color: COLORS.yellow }}>●</span> Grimo (28 offers, validated) · <span style={{ color: COLORS.yellow }}>●</span> Raintree (validated) · <span style={{ color: COLORS.textDim }}>●</span> 7 others (no scrapers)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
