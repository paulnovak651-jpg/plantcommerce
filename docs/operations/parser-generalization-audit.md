# Parser Generalization Audit

**Author:** Claude Code (2026-02-26)
**Files audited:**
- `lib/resolver/parser.ts`
- `lib/resolver/parser-config.ts`
- `lib/resolver/resolver.ts`

---

## Summary

22 extraction/stripping operations total across parser and config:
- **14 already generic** (Category A) — safe to use for any genus
- **6 hazelnut-specific, should move to config** (Category B)
- **2 need per-genus validation before expanding** (Category C)
- **3 resolver hardcoded assumptions** — all hazelnut-specific

---

## Category A: Generic (No Changes Needed)

These patterns are genus-agnostic and work correctly for any plant family.

| Line | Pattern/Operation | Why It's Generic |
|------|-------------------|-----------------|
| 68 | `/(US[\s-]*PP?\s*[\d,]+[\s-]*P?\d*)/` — US patent extraction | Patent numbers are genus-agnostic |
| 76 | `/(USPP\s*[\d,]+)/` — USPP format patent | Same as above, alternate format |
| 85 | `/[™®]|\(TM\)/` — trademark detection | Applies to any trademarked cultivar |
| 93–103 | `/\((Organic\|organic\|Conventional\|conventional)\)/` — organic status | Universal produce/plant attribute |
| 106–111 | `/[-–]\s*(\d[\d\-'"]*\s*(?:year\|yr\|Yr)[\s.\-]*(?:old\|Old)?)/` — age/size 1 | Any plant can have age info |
| 114–117 | `/[-–]\s*(\d+\s+year\s+old)\s*[-–]?/i` — age/size 2 | Same as above, alt format |
| 121–129 | Propagation patterns: `Grafted`, `Seedling`, `Sdlg`, `Seeds?`, `Tubelings?`, `tissue cultured` | All propagation methods apply cross-genus |
| 133–141 | Sale form patterns: `Bare Root`, `potted`, `tubelings?`, `plug`, `container` | Sale forms are genus-agnostic |
| 185–189 | Slash compound stripping (`/\s*\/\s*.*$/`) — keep first part | Cross-slash entries (e.g. "Fuyu/Hachiya") appear in many nursery catalogs; keeping first is a reasonable default |
| 191–192 | `working.replace(/\(cultivar\)/gi, '')` — strip `(cultivar)` text | Generic term used at Z's Nutty Ridge and similar nurseries |
| 194–198 | Cleanup: leading/trailing dash/comma, quote removal, whitespace collapse | Purely cosmetic; genus-agnostic |

---

## Category B: Move to ParserConfig

These patterns are hazelnut-world specific. They won't corrupt names for other genera (a walnut name won't contain "(Filbert)"), but they clutter the parser with genus-specific logic. When adding a new genus, you shouldn't need to touch `parser.ts` — only `parser-config.ts`.

### B1 — `Hazel Layer` propagation term (parser-config.ts line 31)
**Current:** `{ pattern: /\bHazel Layer(?:ed)?\b/, method: 'layered_clone' }`
**Status:** Already in config — but "Hazel Layer" is the hazelnut-specific name. Walnuts use "Grafted" or "Layered Clone". The config key is fine; just add a walnut-specific pattern for walnuts when the time comes.
**Action:** No change needed now — the config structure already supports this. Document that new genera should add their own layering terminology.

### B2 — `(Filbert)` parenthetical stripping (parser.ts line 182–183)
**Current:** `working = working.replace(/\((Filbert|filbert)\)/g, '');`
**Proposal:** Move to `config.noiseTerms` as a regex: `/\((Filbert|filbert)\)/g`
**Why:** This is redundant with the existing `Filbert` noise term, but the parenthetical form needs its own pattern. Already effectively covered by the `noiseTerms` config array — could consolidate.
**Config key addition:**
```typescript
/\((Filbert|filbert)\)/g,  // parenthetical Filbert, Burnt Ridge style
```

### B3 — `"The Crazy Productive One"` nickname (parser.ts lines 161–168)
**Current:** Hardcoded literal string match, set to `marketingText`
**Proposal:** Move to a config array `config.marketingNicknames: RegExp[]`
```typescript
marketingNicknames: [
  /["\s]*The\s+Crazy\s+Productive\s+One["\s]*/,
  // Add per-nursery nicknames here
]
```
**Why:** This nickname is from a specific Grimo product. If another nursery uses comparable proprietary nicknames ("The Original Oregon Hazel", etc.) for other plants, they'd need the same treatment. Having a config array is the right home for these.

### B4 — `"We now have..."` informal text (parser.ts lines 171–173)
**Current:** `const informal = working.match(/We now have.*$/);`
**Proposal:** Move to `config.informalSuffixPatterns: RegExp[]`
```typescript
informalSuffixPatterns: [
  /We now have.*$/,
  // Add per-nursery informal text patterns here
]
```
**Why:** This is specific to one nursery's CMS artifact. Other nurseries have different artifacts ("Limited availability!", "New this year!", etc.).

### B5 — `"Start your own orchard"` suffix (parser.ts lines 177–179)
**Current:** `const suffix = working.match(/[-–]\s*Start\s+your\s+.*$/i);`
**Proposal:** Add to `config.informalSuffixPatterns` (same as B4):
```typescript
/[-–]\s*Start\s+your\s+.*$/i,
```
**Why:** "Orchard" implies tree crops specifically (applies to hazelnuts, walnuts, chestnuts, apples). This is a nursery marketing suffix, not a plant-identifying token. Fine to keep cross-genus — but belongs in config.

### B6 — `Medium/Short Bush` stripping (parser.ts line 197)
**Current:** `working = working.replace(/,?\s*Medium\/Short Bush/g, '');`
**Proposal:** Move to `config.noiseTerms`:
```typescript
/,?\s*Medium\/Short Bush/g,  // Hazelnut growth habit descriptor (Grimo)
```
**Why:** This is a Grimo-specific growth habit descriptor for hazelnuts. It would not appear in walnut or chestnut listings, so it's safe to keep as a no-op for other genera — but it belongs in config, not hardcoded.

---

## Category C: Needs Redesign

These patterns work for hazelnuts but could produce incorrect results for other genera. They need validation against real multi-genus data before expanding.

### C1 — Marketing text stripping after long dash (parser.ts lines 154–159)
**Current:**
```typescript
const marketing = working.match(/\s*[-–]\s*[A-Z][a-z].*$/);
if (marketing && marketing[0].length > 20) {
  result.marketingText = marketing[0].replace(/^[\s\-–]+/, '');
  working = working.slice(0, marketing.index!);
}
```
**Problem:** This strips anything after `– CapitalLetter` if it's >20 chars. For hazelnuts this works because cultivar names are short (1-3 words). But for some genera, cultivar names may legitimately include a long-dash separator followed by a descriptor that IS part of the name. For example, apple varieties sometimes have: "Cox's Orange Pippin — English Dessert Apple" where "English Dessert Apple" is disambiguation info you might want to preserve.
**Proposed approach:** Keep the heuristic but add `config.marketingTextThresholdChars: number` to make the 20-char threshold configurable. When onboarding a new genus, test against 20+ real product names to verify no false positives before enabling.

### C2 — Slash compound handling (parser.ts lines 185–189)
**Current:** Keeps everything before the first `/`, discards the rest.
**Problem:** For rootstock/scion combinations ("Franquette/Paradox" — walnut on Paradox rootstock), the slash indicates rootstock, not a name variant. For grafted trees, both parts are meaningful. For nursery catalog entries with "Plant A / Plant B" as a product bundle, you'd want both. The current behavior (keep first, drop rest) is correct for hazelnut but potentially lossy for other genera.
**Proposed approach:** Add `config.slashHandling: 'keep_first' | 'keep_all' | 'ignore'` (default `'keep_first'`). For walnut/chestnut, may want `'keep_all'` and separate into a `rootstockInfo` field.

---

## Resolver Hardcoded Assumptions

All three are in `lib/resolver/resolver.ts` and are explicitly hazelnut-specific.

### R1 — `SPECIES_KEYWORDS` (resolver.ts lines 37–43)
```typescript
const SPECIES_KEYWORDS: Record<string, string[]> = {
  american: ['american hazelnut', 'corylus americana'],
  beaked:   ['beaked hazelnut', 'corylus cornuta'],
  chilean:  ['chilean hazelnut', 'gevuina avellana'],
  european: ['european hazelnut', 'corylus avellana'],
  turkish:  ['turkish tree hazel', 'corylus colurna'],
};
```
**Problem:** These keywords are Corylus-world ("american" → American Hazelnut). For walnuts, "american" → American Black Walnut (Juglans nigra), which would mis-resolve.
**Proposed approach:** Move to config as `config.speciesKeywords: Record<string, string[]>` and merge indexes at runtime. The hazelnut config keeps these 5 entries; a walnut config adds its own set. The resolver merges all registered configs' keyword maps.

### R2 — `GENERIC_DEFAULT_CANDIDATES` (resolver.ts line 45)
```typescript
const GENERIC_DEFAULT_CANDIDATES = ['european hazelnut', 'corylus avellana'];
```
**Problem:** Any unresolved name with an empty/generic core gets mapped to European Hazelnut. For a multi-genus DB, an empty core could be any species.
**Proposed approach:** Move to `config.genericDefaultCandidates: string[]` — each genus config provides its own default. If multiple genera are active and the core is empty, either (a) require a botanical hint in the product name or (b) mark as `unresolved` rather than guessing.

### R3 — `generic_default` resolution method (resolver.ts lines 272–288)
**Current:** If `normCore` is empty or a seedling term (`''`, `'seedling'`, `'seeds'`, `'sdlg'`), fall back to finding European Hazelnut or the first `plant_entity` in the index.
**Problem:** "the first plant_entity in the index" is non-deterministic when multiple genera are in the alias index. A product with no core name will resolve to whichever species happens to be first in the Map iteration order.
**Proposed approach:** When the alias index is multi-genus, require a `botanicalExtracted` hint before applying `generic_default`. Without a botanical hint, return `unresolved` with a note that genus could not be determined. This is a breaking change for hazelnut behavior and should be done after validating the hazelnut-only path still works.

---

## Recommended Migration Order

### Phase 1 — Config cleanup (do before adding any new genus)
1. Move B2 (`(Filbert)` parenthetical) into `config.noiseTerms` — trivial, no behavior change
2. Move B6 (`Medium/Short Bush`) into `config.noiseTerms` — trivial, no behavior change
3. Add `config.marketingNicknames: RegExp[]` and move B3 (`The Crazy Productive One`) — minor refactor
4. Add `config.informalSuffixPatterns: RegExp[]` and move B4 + B5 — minor refactor

### Phase 2 — Resolver config extraction (do when adding second genus)
5. Extract `SPECIES_KEYWORDS` → `config.speciesKeywords` (R1) — requires API change to `resolveEntity`
6. Extract `GENERIC_DEFAULT_CANDIDATES` → `config.genericDefaultCandidates` (R2) — coupled to #5

### Phase 3 — Multi-genus redesign (do before third genus or when walnut/chestnut is active)
7. Address C1 (marketing text threshold) — add config key, test against new genus data
8. Address C2 (slash compound handling) — add `config.slashHandling`, validate against grafted tree listings
9. Address R3 (generic_default with multi-genus alias index) — most disruptive; should be last
