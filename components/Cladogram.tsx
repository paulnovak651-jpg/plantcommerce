'use client';

import { useMemo, useState } from 'react';

export interface CladogramSpecies {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  family: string;
  genus: string;
  nursery_count: number;
}

const TABS = [
  { id: 'all' as const, label: 'All' },
  { id: 'nuts' as const, label: 'Nut Trees' },
  { id: 'fruit' as const, label: 'Fruit Trees' },
];

const NUT_FAMILIES = new Set([
  'Betulaceae', 'Juglandaceae', 'Fagaceae', 'Proteaceae', 'Anacardiaceae',
]);
const FRUIT_FAMILIES = new Set([
  'Rosaceae', 'Ericaceae', 'Actinidiaceae', 'Moraceae', 'Ebenaceae', 'Vitaceae',
]);

type TabId = 'all' | 'nuts' | 'fruit';

// Layout constants
const ROW_H = 38;
const PAD_TOP = 20;
const PAD_BOTTOM = 28;
const FAMILY_GAP = 0.5;     // extra row-height gap between families

const FAMILY_X = 8;         // family text left anchor
const FAMILY_COL_W = 86;    // max family text width
const J1_X = FAMILY_X + FAMILY_COL_W + 8;    // 102 — junction between family and genus columns

const GENUS_X = J1_X + 10;                    // 112 — genus text left anchor
const GENUS_COL_W = 84;     // max genus text width
const J2_X = GENUS_X + GENUS_COL_W + 8;       // 204 — junction between genus and species columns

const SPECIES_X = J2_X + 10;                  // 214 — species node left edge
const SPECIES_W = 264;
const SPECIES_H = 28;
const DOT_R = 9;
const DOT_CX = SPECIES_X + SPECIES_W - 14;    // nursery count dot center x

const SVG_W = SPECIES_X + SPECIES_W + 10;     // 488

// Connector colors
const LINE_COLOR = '#e2ded6';
const LINE_W = 1.5;

export function Cladogram({ species }: { species: CladogramSpecies[] }) {
  const [activeTab, setActiveTab] = useState<TabId>('all');

  const filtered = useMemo(() => {
    if (activeTab === 'all') return species;
    if (activeTab === 'nuts') return species.filter((s) => NUT_FAMILIES.has(s.family));
    return species.filter((s) => FRUIT_FAMILIES.has(s.family));
  }, [species, activeTab]);

  const { groups, svgHeight } = useMemo(() => {
    // Group: family → genus → species[]
    const familyMap = new Map<string, Map<string, CladogramSpecies[]>>();
    for (const s of filtered) {
      if (!familyMap.has(s.family)) familyMap.set(s.family, new Map());
      const gm = familyMap.get(s.family)!;
      if (!gm.has(s.genus)) gm.set(s.genus, []);
      gm.get(s.genus)!.push(s);
    }

    type SpeciesRow = { species: CladogramSpecies; y: number };
    type GenusGroup = {
      genus: string;
      genusY: number;
      firstY: number;
      lastY: number;
      rows: SpeciesRow[];
    };
    type FamilyGroup = {
      family: string;
      familyY: number;
      firstGenusY: number;
      lastGenusY: number;
      genera: GenusGroup[];
    };

    let rowIdx = 0;
    let isFirst = true;
    const groups: FamilyGroup[] = [];

    for (const [family, genusMap] of familyMap) {
      if (!isFirst) rowIdx += FAMILY_GAP;
      isFirst = false;

      const genera: GenusGroup[] = [];
      let firstGenusY = -1;
      let lastGenusY = -1;

      for (const [genus, speciesList] of genusMap) {
        const rows: SpeciesRow[] = [];
        const firstY = PAD_TOP + rowIdx * ROW_H + ROW_H / 2;

        for (const s of speciesList) {
          const y = PAD_TOP + rowIdx * ROW_H + ROW_H / 2;
          rows.push({ species: s, y });
          rowIdx++;
        }

        const lastY = PAD_TOP + (rowIdx - 1) * ROW_H + ROW_H / 2;
        const genusY = (firstY + lastY) / 2;

        if (firstGenusY === -1) firstGenusY = genusY;
        lastGenusY = genusY;

        genera.push({ genus, genusY, firstY, lastY, rows });
      }

      const familyY = (firstGenusY + lastGenusY) / 2;
      groups.push({ family, familyY, firstGenusY, lastGenusY, genera });
    }

    const svgHeight = PAD_TOP + rowIdx * ROW_H + PAD_BOTTOM;
    return { groups, svgHeight };
  }, [filtered]);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border-subtle">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-sm text-text-tertiary">
          No species in this category yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <svg
            width={SVG_W}
            height={svgHeight}
            viewBox={`0 0 ${SVG_W} ${svgHeight}`}
            xmlns="http://www.w3.org/2000/svg"
            style={{ fontFamily: 'var(--font-satoshi, sans-serif)', display: 'block' }}
            aria-label="Taxonomic cladogram"
          >
            <style>{`
              .s-node { cursor: pointer; }
              .s-node .s-rect { fill: transparent; transition: fill 0.12s; }
              .s-node:hover .s-rect { fill: #edf7ef; }
              .s-node .s-name { fill: #2d6a4f; transition: fill 0.12s; }
              .s-node:hover .s-name { fill: #1a5c40; }
            `}</style>

            {groups.map((group) => (
              <g key={group.family}>
                {/* ── Family label ── */}
                <text
                  x={FAMILY_X}
                  y={group.familyY + 4}
                  fontSize="10"
                  fill="#8a8279"
                  letterSpacing="0.08em"
                  textAnchor="start"
                  fontWeight="500"
                >
                  {group.family.toUpperCase()}
                </text>

                {/* Family → J1 horizontal */}
                <line
                  x1={FAMILY_X + FAMILY_COL_W}
                  y1={group.familyY}
                  x2={J1_X}
                  y2={group.familyY}
                  stroke={LINE_COLOR}
                  strokeWidth={LINE_W}
                />

                {/* J1 vertical (only when multiple genera) */}
                {group.firstGenusY !== group.lastGenusY && (
                  <line
                    x1={J1_X}
                    y1={group.firstGenusY}
                    x2={J1_X}
                    y2={group.lastGenusY}
                    stroke={LINE_COLOR}
                    strokeWidth={LINE_W}
                  />
                )}

                {group.genera.map((genusGroup) => (
                  <g key={genusGroup.genus}>
                    {/* J1 → Genus horizontal */}
                    <line
                      x1={J1_X}
                      y1={genusGroup.genusY}
                      x2={GENUS_X - 2}
                      y2={genusGroup.genusY}
                      stroke={LINE_COLOR}
                      strokeWidth={LINE_W}
                    />

                    {/* ── Genus label ── */}
                    <text
                      x={GENUS_X}
                      y={genusGroup.genusY + 4}
                      fontSize="11"
                      fill="#5c554b"
                      fontStyle="italic"
                      textAnchor="start"
                    >
                      {genusGroup.genus}
                    </text>

                    {/* Genus → J2 horizontal */}
                    <line
                      x1={GENUS_X + GENUS_COL_W}
                      y1={genusGroup.genusY}
                      x2={J2_X}
                      y2={genusGroup.genusY}
                      stroke={LINE_COLOR}
                      strokeWidth={LINE_W}
                    />

                    {/* J2 vertical (only when multiple species) */}
                    {genusGroup.firstY !== genusGroup.lastY && (
                      <line
                        x1={J2_X}
                        y1={genusGroup.firstY}
                        x2={J2_X}
                        y2={genusGroup.lastY}
                        stroke={LINE_COLOR}
                        strokeWidth={LINE_W}
                      />
                    )}

                    {genusGroup.rows.map(({ species: s, y }) => (
                      <g key={s.id}>
                        {/* J2 → Species horizontal */}
                        <line
                          x1={J2_X}
                          y1={y}
                          x2={SPECIES_X}
                          y2={y}
                          stroke={LINE_COLOR}
                          strokeWidth={LINE_W}
                        />

                        {/* ── Species node (clickable) ── */}
                        <a href={`/plants/${s.slug}`} className="s-node">
                          <rect
                            className="s-rect"
                            x={SPECIES_X}
                            y={y - SPECIES_H / 2}
                            width={SPECIES_W}
                            height={SPECIES_H}
                            rx="5"
                          />
                          <text
                            className="s-name"
                            x={SPECIES_X + 10}
                            y={y + 5}
                            fontSize="13"
                            fontWeight="500"
                          >
                            {s.canonical_name}
                          </text>

                          {/* Nursery count badge */}
                          {s.nursery_count > 0 && (
                            <>
                              <circle
                                cx={DOT_CX}
                                cy={y}
                                r={DOT_R}
                                fill="#d8f3dc"
                              />
                              <text
                                x={DOT_CX}
                                y={y + 4}
                                fontSize="9"
                                fill="#2d6a4f"
                                fontWeight="700"
                                textAnchor="middle"
                              >
                                {s.nursery_count}
                              </text>
                            </>
                          )}
                        </a>
                      </g>
                    ))}
                  </g>
                ))}
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
