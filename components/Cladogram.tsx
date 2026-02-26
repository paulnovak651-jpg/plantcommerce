'use client';

import { useMemo } from 'react';
import Link from 'next/link';

export interface CladogramSpecies {
  id: string;
  slug: string;
  canonical_name: string;
  botanical_name: string | null;
  family: string;
  genus: string;
  nursery_count: number;
  cultivar_count?: number;
  zone_min?: number | null;
  zone_max?: number | null;
}

const NUT_FAMILIES = new Set([
  'Betulaceae', 'Juglandaceae', 'Fagaceae', 'Proteaceae', 'Anacardiaceae',
]);
const FRUIT_FAMILIES = new Set([
  'Rosaceae', 'Ericaceae', 'Actinidiaceae', 'Moraceae', 'Ebenaceae', 'Vitaceae',
]);

function matchesCategory(s: CladogramSpecies, category: string): boolean {
  if (category === 'all') return true;
  if (category === 'nut') return NUT_FAMILIES.has(s.family);
  if (category === 'fruit') return FRUIT_FAMILIES.has(s.family);
  if (category === 'other') return !NUT_FAMILIES.has(s.family) && !FRUIT_FAMILIES.has(s.family);
  return true;
}

// Layout constants
const ROW_H = 38;
const PAD_TOP = 20;
const PAD_BOTTOM = 28;
const FAMILY_GAP = 0.5;

const FAMILY_X = 8;
const FAMILY_COL_W = 86;
const J1_X = FAMILY_X + FAMILY_COL_W + 8;       // 102

const GENUS_X = J1_X + 10;                       // 112
const GENUS_COL_W = 84;
const J2_X = GENUS_X + GENUS_COL_W + 8;          // 204

const SPECIES_X = J2_X + 10;                     // 214
const SPECIES_H = 28;
const DOT_R = 9;

// Zone mini-bar dimensions
const ZONE_BAR_W = 36;
const ZONE_BAR_H = 4;
const ZONE_MIN_SCALE = 1;
const ZONE_MAX_SCALE = 13;
const ZONE_SCALE_RANGE = ZONE_MAX_SCALE - ZONE_MIN_SCALE;

// Right side of species node: nursery dot → gap → zone bar → gap → name
const DOT_CX_FROM_LEFT = 214 + 290 - 14;         // 490
const ZONE_BAR_RIGHT_X = DOT_CX_FROM_LEFT - DOT_R - 10; // 471
const ZONE_BAR_START_X = ZONE_BAR_RIGHT_X - ZONE_BAR_W; // 435
const NAME_MAX_X = ZONE_BAR_START_X - 8;         // 427 — name clips here

const SPECIES_W = 290;
const DOT_CX = SPECIES_X + SPECIES_W - 14;       // 490
const SVG_W = SPECIES_X + SPECIES_W + 10;        // 514

// Connector colors
const LINE_COLOR = '#e2ded6';
const LINE_W = 1.5;

interface CladogramProps {
  species: CladogramSpecies[];
  /** Active category filter — dims non-matching species */
  category?: string;
  /** Called when a species is selected in desktop SVG view */
  onSpeciesSelect?: (slug: string) => void;
  /** Currently selected slug (highlights in SVG) */
  selectedSlug?: string | null;
}

export function Cladogram({
  species,
  category = 'all',
  onSpeciesSelect,
  selectedSlug,
}: CladogramProps) {

  const { groups, svgHeight } = useMemo(() => {
    const familyMap = new Map<string, Map<string, CladogramSpecies[]>>();
    for (const s of species) {
      if (!familyMap.has(s.family)) familyMap.set(s.family, new Map());
      const gm = familyMap.get(s.family)!;
      if (!gm.has(s.genus)) gm.set(s.genus, []);
      gm.get(s.genus)!.push(s);
    }

    type SpeciesRow = { species: CladogramSpecies; y: number };
    type GenusGroup = { genus: string; genusY: number; firstY: number; lastY: number; rows: SpeciesRow[] };
    type FamilyGroup = { family: string; familyY: number; firstGenusY: number; lastGenusY: number; genera: GenusGroup[] };

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
  }, [species]);

  return (
    <div>
      {species.length === 0 ? (
        <p className="py-8 text-sm text-text-tertiary">No species match the current filters.</p>
      ) : (
        <>
          {/* ── Mobile list view ── */}
          <div className="space-y-5 md:hidden">
            {groups.map((group) => (
              <div key={group.family}>
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-text-tertiary">
                  {group.family}
                </p>
                {group.genera.map((genusGroup) => (
                  <div key={genusGroup.genus} className="mb-3 ml-3">
                    <p className="mb-1 text-sm italic text-text-secondary">{genusGroup.genus}</p>
                    <div className="ml-3">
                      {genusGroup.rows.map(({ species: s }) => {
                        const active = matchesCategory(s, category);
                        return (
                          <Link
                            key={s.id}
                            href={`/plants/${s.slug}`}
                            className={`flex items-center gap-2 py-2 text-sm font-medium transition-opacity ${
                              active ? 'text-accent' : 'pointer-events-none text-text-tertiary opacity-30'
                            }`}
                          >
                            {s.canonical_name}
                            {(s.cultivar_count ?? 0) > 0 && (
                              <span className="text-xs text-text-tertiary">({s.cultivar_count})</span>
                            )}
                            {s.nursery_count > 0 && (
                              <span className="rounded-full bg-accent-light px-2 py-0.5 text-xs font-semibold text-accent">
                                {s.nursery_count}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* ── Desktop SVG cladogram ── */}
          <div className="hidden overflow-x-auto md:block">
            <svg
              width={SVG_W}
              height={svgHeight}
              viewBox={`0 0 ${SVG_W} ${svgHeight}`}
              xmlns="http://www.w3.org/2000/svg"
              style={{ fontFamily: 'var(--font-satoshi, sans-serif)', display: 'block' }}
              aria-label="Taxonomic cladogram"
            >
              <defs>
                {/* Clip path for species name text — prevents overflow into zone bar */}
                <clipPath id="nameClip">
                  <rect x={SPECIES_X + 10} y={0} width={NAME_MAX_X - (SPECIES_X + 10)} height={svgHeight} />
                </clipPath>
              </defs>

              <style>{`
                .s-node { cursor: pointer; }
                .s-node .s-rect { fill: transparent; transition: fill 0.12s; }
                .s-node:hover .s-rect { fill: #edf7ef; }
                .s-node .s-name { fill: #2d6a4f; transition: fill 0.12s; }
                .s-node:hover .s-name { fill: #1a5c40; }
                .s-node.s-selected .s-rect { fill: #edf7ef; }
              `}</style>

              {groups.map((group) => (
                <g key={group.family}>
                  {/* Family label */}
                  <text x={FAMILY_X} y={group.familyY + 4} fontSize="10" fill="#8a8279"
                    letterSpacing="0.08em" textAnchor="start" fontWeight="500">
                    {group.family.toUpperCase()}
                  </text>

                  {/* Family → J1 */}
                  <line x1={FAMILY_X + FAMILY_COL_W} y1={group.familyY} x2={J1_X} y2={group.familyY}
                    stroke={LINE_COLOR} strokeWidth={LINE_W} />

                  {/* J1 vertical */}
                  {group.firstGenusY !== group.lastGenusY && (
                    <line x1={J1_X} y1={group.firstGenusY} x2={J1_X} y2={group.lastGenusY}
                      stroke={LINE_COLOR} strokeWidth={LINE_W} />
                  )}

                  {group.genera.map((genusGroup) => (
                    <g key={genusGroup.genus}>
                      <line x1={J1_X} y1={genusGroup.genusY} x2={GENUS_X - 2} y2={genusGroup.genusY}
                        stroke={LINE_COLOR} strokeWidth={LINE_W} />

                      <text x={GENUS_X} y={genusGroup.genusY + 4} fontSize="11" fill="#5c554b"
                        fontStyle="italic" textAnchor="start">
                        {genusGroup.genus}
                      </text>

                      <line x1={GENUS_X + GENUS_COL_W} y1={genusGroup.genusY} x2={J2_X} y2={genusGroup.genusY}
                        stroke={LINE_COLOR} strokeWidth={LINE_W} />

                      {genusGroup.firstY !== genusGroup.lastY && (
                        <line x1={J2_X} y1={genusGroup.firstY} x2={J2_X} y2={genusGroup.lastY}
                          stroke={LINE_COLOR} strokeWidth={LINE_W} />
                      )}

                      {genusGroup.rows.map(({ species: s, y }) => {
                        const active = matchesCategory(s, category);
                        const isSelected = s.slug === selectedSlug;
                        const nameWithCount = (s.cultivar_count ?? 0) > 0
                          ? `${s.canonical_name} (${s.cultivar_count})`
                          : s.canonical_name;

                        // Zone mini-bar fill geometry
                        let zoneFillX = ZONE_BAR_START_X;
                        let zoneFillW = 0;
                        if (s.zone_min != null && s.zone_max != null) {
                          const lo = Math.min(s.zone_min, s.zone_max);
                          const hi = Math.max(s.zone_min, s.zone_max);
                          zoneFillX = ZONE_BAR_START_X + ((lo - ZONE_MIN_SCALE) / ZONE_SCALE_RANGE) * ZONE_BAR_W;
                          zoneFillW = Math.max(((hi - lo) / ZONE_SCALE_RANGE) * ZONE_BAR_W, 2);
                        }

                        const NodeWrapper = ({ children }: { children: React.ReactNode }) =>
                          onSpeciesSelect ? (
                            <g
                              className={`s-node${isSelected ? ' s-selected' : ''}`}
                              onClick={() => onSpeciesSelect(s.slug)}
                            >
                              {children}
                            </g>
                          ) : (
                            <a href={`/plants/${s.slug}`} className="s-node">
                              {children}
                            </a>
                          );

                        return (
                          <g key={s.id} opacity={active ? 1 : 0.3}
                            style={{ pointerEvents: active ? 'auto' : 'none' }}>
                            {/* J2 → Species */}
                            <line x1={J2_X} y1={y} x2={SPECIES_X} y2={y}
                              stroke={LINE_COLOR} strokeWidth={LINE_W} />

                            <NodeWrapper>
                              <rect className="s-rect" x={SPECIES_X} y={y - SPECIES_H / 2}
                                width={SPECIES_W} height={SPECIES_H} rx="5" />

                              {/* Species name (clipped) */}
                              <text className="s-name" x={SPECIES_X + 10} y={y + 5}
                                fontSize="13" fontWeight="500" clipPath="url(#nameClip)">
                                {nameWithCount}
                              </text>

                              {/* Zone mini-bar */}
                              {s.zone_min != null && s.zone_max != null && (
                                <g>
                                  {/* Track */}
                                  <rect x={ZONE_BAR_START_X} y={y - ZONE_BAR_H / 2}
                                    width={ZONE_BAR_W} height={ZONE_BAR_H} rx="2" fill="#edeae4" />
                                  {/* Fill */}
                                  <rect x={zoneFillX} y={y - ZONE_BAR_H / 2}
                                    width={zoneFillW} height={ZONE_BAR_H} rx="2" fill="#d8f3dc" />
                                </g>
                              )}

                              {/* Nursery count badge */}
                              {s.nursery_count > 0 && (
                                <>
                                  <circle cx={DOT_CX} cy={y} r={DOT_R} fill="#d8f3dc" />
                                  <text x={DOT_CX} y={y + 4} fontSize="9" fill="#2d6a4f"
                                    fontWeight="700" textAnchor="middle">
                                    {s.nursery_count}
                                  </text>
                                </>
                              )}
                            </NodeWrapper>
                          </g>
                        );
                      })}
                    </g>
                  ))}
                </g>
              ))}
            </svg>
          </div>
        </>
      )}
    </div>
  );
}
