# Genus Research Protocol

**Purpose:** You are a research agent helping build a plant database for PlantCommerce — a plant comparison platform for permaculture growers ("PCPartPicker for nursery stock"). Your job is to research a plant genus and fill out this structured template. **Do not write any SQL.** Just fill in the data fields below using authoritative sources.

---

## Instructions

### What to research

For each species (or hybrid species) in the genus that is relevant to **North American permaculture, food forestry, or orchard production**, fill out one Species Block (Section C). Include:

- The major cultivated species that NA growers plant
- Cold-hardy or regionally important species (e.g., native species, rootstock species)
- Interspecific hybrids if they are commonly grown (mark as `hybrid_species`)
- Skip purely ornamental cultivars unless they have rootstock or pollination significance

### Where to find data

Use authoritative sources. Prioritize in this order:

1. **USDA PLANTS Database** (plants.usda.gov) — native range, hardiness zones
2. **NCSU Plant Toolbox** (plants.ces.ncsu.edu) — growing profiles, size, soil
3. **University extension publications** (e.g., Purdue, Oregon State, Cornell, UC ANR)
4. **USDA NRCS Plant Guides / Fact Sheets**
5. **Published horticultural references** (Michael Dirr, etc.)
6. **Wikipedia** — acceptable for basic taxonomy, supplement with primary sources

### Rules

- **North American context only.** Hardiness zones, soil types, and cultivation notes should reflect NA growing conditions.
- **Cite every source** in the `data_sources` field for each species.
- **Use only the listed enum values.** Each constrained field shows valid options in `[brackets]`. Pick one (or list items for array fields). If none fit, use `null`.
- **Leave unknown fields as `null`.** Do not guess. A null value is better than a wrong value.
- **Description:** 1–2 sentences focusing on NA permaculture relevance (food production, ecological function, rootstock use).
- **Species epithet:** The second word of the botanical name (e.g., botanical name `Pyrus communis` → species epithet is `communis`).

---

## Section A: Genus Header

*Paul fills this section before handing off to the research agent.*

```yaml
genus:
common_name:
family:
taxonomy_node_uuid:           # leave blank if unknown — implementation agent looks it up
migration_number:             # leave blank — implementation agent assigns
```

---

## Section B: Species Template

*Copy this block once per species. Fill every field or set to `null`.*

```yaml
# ── Species: [common name] ──

slug:                           # lowercase genus-species, e.g. pyrus-communis
canonical_name:                 # common name, e.g. European Pear
botanical_name:                 # full binomial, e.g. Pyrus communis
species_epithet:                # second word of botanical_name, e.g. communis
entity_type:                    # [species | subspecies | hybrid_species | species_group]
taxonomy_confidence: verified   # [verified | provisional | needs_review]
description: >
  (1-2 sentences, NA permaculture relevance)

# ── Growing Profile ──

usda_zone_min:                  # integer (e.g. 4), or null
usda_zone_max:                  # integer (e.g. 9), or null
soil_ph_min:                    # decimal (e.g. 5.5), or null
soil_ph_max:                    # decimal (e.g. 7.0), or null
soil_drainage:                  # [well_drained | moderate | tolerates_wet | requires_wet]
soil_texture_tolerances:        # list of: loam, sandy_loam, clay_loam, sand, clay, silt_loam
  - loam
  - sandy_loam
sun_requirement:                # [full_sun | part_shade | full_shade | shade_tolerant]
growth_rate:                    # [slow | moderate | fast | very_fast]
root_architecture:              # [taproot | fibrous | spreading | suckering]
native_range_description: >
  (where the species originates, 1-2 sentences)
mature_height_min_ft:           # number, or null
mature_height_max_ft:           # number, or null
mature_spread_min_ft:           # number, or null
mature_spread_max_ft:           # number, or null
years_to_bearing_min:           # integer, or null
years_to_bearing_max:           # integer, or null
harvest_season:                 # [very_early | early | early_mid | mid | mid_late | late | very_late]
data_sources:                   # list — cite every source used for this species
  - "NCSU Plant Toolbox: Genus species"
  - "USDA NRCS Plant Guide"

# ── Extended Growing Profile (optional — fill if data is readily available) ──

ahs_heat_zone_max:              # integer, or null
chill_hours_min:                # integer, or null
chill_hours_max:                # integer, or null
chill_hours_notes:              # text, or null — e.g. "Low-chill to high-chill selections exist"
soil_notes:                     # text, or null — e.g. "Avoid heavy waterlogged soils"
water_needs:                    # text, or null — e.g. "Moderate; irrigate during dry spells"
drought_tolerance:              # integer 1-5 (1=low, 5=high), or null
flood_tolerance:                # integer 1-5 (1=low, 5=high), or null
form_description:               # text, or null — e.g. "Upright spreading canopy"
nitrogen_fixer:                 # true | false | null
allelopathic:                   # true | false | null
allelopathic_notes:             # text, or null
wildlife_value:                 # list of text, or null — e.g. ["bird food", "pollinator support"]
ecological_notes:               # text, or null
productive_lifespan_years:      # integer, or null
companion_plants:               # list of text, or null — e.g. ["comfrey", "clover"]
spacing_notes:                  # text, or null
pruning_notes:                  # text, or null

# ── Pollination Profile ──

pollination_type:               # common values: self_fertile, cross_required, partially_self, wind_cross
pollination_mechanism:          # common values: wind, insect, wind_and_insect
min_pollinizer_count:           # integer, or null
max_pollinizer_distance_ft:     # integer, or null
bloom_period_general:           # free text, e.g. "spring", "early spring"
pollination_notes: >
  (any relevant notes about pollination requirements)

# ── Parentage (ONLY for hybrid_species — delete this section for regular species) ──

parents:
  - slug:                       # slug of parent species 1
    contribution_percent: 50
  - slug:                       # slug of parent species 2
    contribution_percent: 50
parentage_data_source: "Published hybrid cross documentation"
```

---

## Section C: Filled Genus Summary

*Research agent fills this section after completing all species.*

```
Species count:
Hybrids:
Sources cited:
Extended profiles filled: (yes/no, and which species)
Fields left null:             # list field names and count, e.g. soil_ph_min (3), soil_ph_max (3)
```

---

## Example: Pyrus (Pears)

Below is what a completed research document looks like, based on the Pyrus genus already in the database.

### Genus Header

```yaml
genus: Pyrus
common_name: Pears
family: Rosaceae
taxonomy_node_uuid: d0000000-0000-0000-0000-000000000008
migration_number:
```

### Species 1: European Pear

```yaml
slug: pyrus-communis
canonical_name: European Pear
botanical_name: Pyrus communis
species_epithet: communis
entity_type: species
taxonomy_confidence: verified
description: >
  European pear is the primary pear species for temperate orchard production
  in North America. Most cultivars set best with compatible cross-pollinizers
  and insect pollination.

usda_zone_min: 4
usda_zone_max: 9
soil_ph_min: null
soil_ph_max: null
soil_drainage: well_drained
soil_texture_tolerances:
  - loam
  - sandy_loam
  - clay_loam
sun_requirement: full_sun
growth_rate: moderate
root_architecture: spreading
native_range_description: >
  Native to a broad region from Europe into Western Asia; widely cultivated
  in North America.
mature_height_min_ft: 40
mature_height_max_ft: 50
mature_spread_min_ft: 25
mature_spread_max_ft: 35
years_to_bearing_min: 3
years_to_bearing_max: 7
harvest_season: mid
data_sources:
  - "NCSU Plant Toolbox: Pyrus communis"
  - "General horticultural consensus (NA cultivation)"

# Extended — not filled for this genus
ahs_heat_zone_max: null
chill_hours_min: null
chill_hours_max: null
chill_hours_notes: null
soil_notes: null
water_needs: null
drought_tolerance: null
flood_tolerance: null
form_description: null
nitrogen_fixer: null
allelopathic: null
allelopathic_notes: null
wildlife_value: null
ecological_notes: null
productive_lifespan_years: null
companion_plants: null
spacing_notes: null
pruning_notes: null

pollination_type: cross_required
pollination_mechanism: insect
min_pollinizer_count: 1
max_pollinizer_distance_ft: 100
bloom_period_general: spring
pollination_notes: >
  Typically requires a compatible second pear variety with overlapping bloom
  for reliable fruit set.
```

### Summary

```
Species count: 4
Hybrids: 0
Sources cited: 8
Extended profiles filled: no
Fields left null: soil_ph_min (4), soil_ph_max (4), all extended fields
```

---

## Handoff

When complete, save this as `genus-research-[genus].md` (e.g., `genus-research-diospyros.md`) and give it to the implementation agent along with `docs/genus-upload-protocol.md`.
