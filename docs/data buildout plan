 Plant Commerce — Systematic Data Buildout Plan

*Created: 2026-03-10*
*Goal: Populate accurate, complete plant data genus-by-genus*

---

## Current State Assessment

### What Exists
- **Schema**: Wave 1 deployed — `plant_entities`, `cultivars`, `aliases`, `nurseries`, `inventory_offers` all live in Supabase
- **Knowledge Graph Schema**: Migrations 002-008 are *designed but not yet deployed* — taxonomy_nodes, species_growing_profiles, species_pollination_profiles, cultivar_traits, rootstock_compatibility
- **Hazelnut (Corylus)**: Fully built out as pilot — 7 plant_entities, 44 cultivars, 17 aliases, 10 nurseries, growing profile seed data in migration 003
- **Other Genera**: Only exist in `GENUS_COMMON_NAMES` mapping and taxonomy seed data — zero actual plant_entities or cultivars for Malus, Prunus, Castanea, Juglans, Carya, Diospyros, Sambucus

### What's Missing
1. The Wave 4 migrations (002-008) need to be deployed to Supabase to enable growing profiles, pollination, cultivar traits, etc.
2. Every genus besides Corylus has **zero data** in the actual database
3. No standardized "data completeness" checklist per genus

---

## Required Data Fields Per Plant

Based on the schema, here's every field that needs to be populated for a genus to be considered "complete":

### Per Species (plant_entity + species_growing_profile)

| Category | Fields | Source Priority |
|----------|--------|----------------|
| **Identity** | canonical_name, botanical_name, family, genus, species, entity_type, description | Reference texts |
| **Hardiness** | usda_zone_min, usda_zone_max, usda_zone_notes, chill_hours_min, chill_hours_max | USDA, Extension services |
| **Soil** | soil_ph_min, soil_ph_max, soil_drainage, soil_textures, soil_notes | Extension services |
| **Light & Water** | sun_requirement, water_needs, drought_tolerance (1-5) | Extension services |
| **Size & Form** | mature_height_min/max_ft, mature_spread_min/max_ft, growth_rate, root_type | Arboretum data |
| **Ecology** | native_range, nitrogen_fixer, allelopathic_notes, wildlife_value | USDA Plants DB |
| **Production** | years_to_bearing_min/max, harvest_season, productive_lifespan_years | Extension, grower reports |
| **Pollination** | pollination_type, pollination_mechanism, min_pollinizer_count, max_pollinizer_distance_ft, bloom_period_general | Breeding program data |

### Per Cultivar (cultivar + cultivar_traits)

| Category | Fields | Source Priority |
|----------|--------|----------------|
| **Identity** | canonical_name, material_type, breeder, origin_location, year_released, patent_status, description | Nursery catalogs, patent DB |
| **Aliases** | All known trade names, nursery variants, former names, misspellings | Nursery catalog scraping |
| **Production Traits** | nut_weight_g / fruit_weight_g, kernel_pct, flavor_notes, storage_quality | Breeding program publications |
| **Disease Resistance** | disease_resistance JSONB (genus-specific diseases) | Extension, breeding programs |
| **Bloom Timing** | bloom_period, bloom_overlap notes | Pollination research |
| **Harvest** | harvest_window | Regional extension data |
| **Legal** | patent numbers, trademark status | USPTO, USDA PVPO |

### Per Pollination Group (for cross-pollination genera)

| Category | Fields |
|----------|--------|
| **Group Definition** | group_code, group_name, description |
| **Cultivar Assignments** | which cultivars belong to which groups |
| **Compatibility Pairs** | explicit compatible/incompatible overrides |

### Per Rootstock (for grafted genera like Malus, Prunus)

| Category | Fields |
|----------|--------|
| **Rootstock Entry** | cultivar record with material_type context |
| **Compatibility** | scion/rootstock pairs, vigor_effect, precocity_effect |
| **Interstem** | interstem_required, interstem_cultivar_id |

---

## Genus Priority Order

Ordered by: permaculture relevance × data availability × user demand

| # | Genus | Common Name | Why This Order | Est. Species | Est. Cultivars |
|---|-------|-------------|----------------|-------------|----------------|
| 1 | **Malus** | Apples | Most widely grown, massive cultivar list, high demand | 4-6 | 80-120+ |
| 2 | **Prunus** | Stone Fruits | Cherries, plums, peaches — huge category, complex rootstock | 8-12 | 100-150+ |
| 3 | **Castanea** | Chestnuts | Strong permaculture staple, moderate cultivar count | 4-5 | 20-30 |
| 4 | **Juglans** | Walnuts | Important nut tree, allelopathy data critical | 4-5 | 15-25 |
| 5 | **Carya** | Hickories & Pecans | Deep-rooted, long-lived, growing northern interest | 5-8 | 30-50 |
| 6 | **Diospyros** | Persimmons | American + Asian, growing popularity | 2-3 | 20-30 |
| 7 | **Sambucus** | Elderberries | Fast establishment, food forest staple | 2-3 | 10-15 |
| 8 | **Vaccinium** | Blueberries | (Not yet in genus list — should add) | 3-4 | 40-60 |
| 9 | **Rubus** | Raspberries/Blackberries | (Not yet in genus list — should add) | 3-5 | 30-50 |
| 10 | **Ribes** | Currants & Gooseberries | (Not yet in genus list — should add) | 3-4 | 15-25 |

---

## Process Per Genus (The Playbook)

### Phase 1: Species Identification
1. Identify all permaculture-relevant species within the genus
2. Identify relevant hybrid crosses (e.g., Malus domestica × M. sieversii)
3. Create plant_entity records with botanical accuracy
4. Add common name aliases for each species
5. Link to taxonomy_nodes

### Phase 2: Cultivar Census
1. Research cultivars actually available in the nursery trade (focus on what can be bought)
2. Categorize by material_type: cultivar_clone, named_seed_strain, rootstock, etc.
3. For each cultivar capture: breeder, origin, year released, patent status
4. Scrape nursery catalogs for alias discovery (name variants, trade names)
5. Add legal identifiers (plant patents, trademarks)

### Phase 3: Growing Profiles
1. Fill species_growing_profiles for each species
2. Verify zone ranges against USDA data and extension publications
3. Document soil, light, water requirements
4. Record size, growth rate, root characteristics
5. Note ecological attributes (nitrogen fixation, allelopathy, wildlife value)

### Phase 4: Pollination & Reproduction
1. Document pollination type per species (self-fertile, cross-required, dioecious, etc.)
2. Map pollination groups (S-alleles for apples, bloom groups, etc.)
3. Assign cultivars to pollination groups
4. Document bloom timing per cultivar
5. Add explicit compatibility pairs where group inference is insufficient

### Phase 5: Cultivar Traits
1. Fill cultivar_traits for each cultivar
2. Document disease resistance (genus-specific disease vocabulary)
3. Record production traits (fruit/nut weight, flavor, storage)
4. Add harvest window data
5. Set curation_status = 'published' for verified data

### Phase 6: Rootstock (grafted genera only)
1. Add rootstock cultivar entries
2. Map scion/rootstock compatibility
3. Document vigor and precocity effects
4. Note interstem requirements

### Phase 7: Validation & QA
1. Cross-reference data against 2-3 independent sources
2. Run completeness check — flag any species/cultivar with missing critical fields
3. Review aliases for disambiguation accuracy
4. Refresh materialized search index

---

## Starting Point: Malus (Apples)

### Phase 1 — Species to Create

| Slug | Canonical Name | Botanical Name | Entity Type |
|------|---------------|----------------|-------------|
| malus-domestica | Domestic Apple | Malus domestica | species |
| malus-sylvestris | European Crab Apple | Malus sylvestris | species |
| malus-sieversii | Central Asian Wild Apple | Malus sieversii | species |
| malus-pumila | Paradise Apple | Malus pumila | species |
| malus-coronaria | Sweet Crab Apple | Malus coronaria | species |
| malus-ioensis | Prairie Crab Apple | Malus ioensis | species |
| malus-baccata | Siberian Crab Apple | Malus baccata | species |
| malus-domestica-hybrids | Apple Hybrids | Malus domestica (hybrids) | hybrid_species |

### Phase 2 — Cultivar Categories for Malus

**Scion Cultivars** (the named eating/cooking apples):
- Heritage/antique varieties (pre-1900): Gravenstein, Cox's Orange Pippin, Northern Spy, Rhode Island Greening, Baldwin, Esopus Spitzenburg, Newtown Pippin, etc.
- Modern commercial: Honeycrisp, Gala, Fuji, Granny Smith, Pink Lady/Cripps Pink, Jazz, Cosmic Crisp, etc.
- Disease-resistant: Liberty, Freedom, Enterprise, Goldrush, Pristine, Redfree, William's Pride, etc.
- Cider varieties: Kingston Black, Dabinett, Yarlington Mill, Harry Masters Jersey, etc.
- Cold-hardy: Haralson, Honeygold, Zestar, Sweet Sixteen, Chestnut Crab, etc.
- Multi-use/homestead: Gravenstein, Arkansas Black, Ashmead's Kernel, etc.

**Rootstocks** (critical for apple commerce):
- M.9, M.26, M.7, MM.106, MM.111 (Malling/Malling-Merton series)
- G.11, G.41, G.210, G.890, G.935, G.969 (Geneva series — disease resistant)
- B.9, B.10 (Budagovsky series — cold hardy)
- Antonovka (seedling rootstock)
- M.27 (ultra-dwarf)

**Pollinizer/Crab Cultivars**:
- Dolgo, Manchurian Crab, Indian Summer, etc.

### Phase 3 — Apple Growing Profile Key Fields

| Field | Typical Apple Value |
|-------|-------------------|
| usda_zone_min | 3-4 (varies by cultivar) |
| usda_zone_max | 8-9 |
| chill_hours_min | 200 (low-chill) to 1000+ |
| chill_hours_max | 1800 |
| soil_ph_min | 6.0 |
| soil_ph_max | 7.0 |
| soil_drainage | well_drained |
| sun_requirement | full_sun |
| water_needs | moderate |
| years_to_bearing_min | 2 (dwarf) to 5 (standard) |
| years_to_bearing_max | 4 (dwarf) to 8 (standard) |
| productive_lifespan | 30-100+ years |

### Phase 4 — Apple Pollination System

Apples use a **S-allele incompatibility system** (similar to hazelnuts but more complex):
- Most apples are cross_required (need a different cultivar for pollination)
- Some are triploid (need TWO other pollinizers and cannot pollinate others)
- Bloom timing groups: Early, Early-Mid, Mid, Mid-Late, Late
- Effective pollination distance: ~100 feet for bee-pollinated
- Key disease: Apple Scab, Fire Blight, Cedar Apple Rust, Powdery Mildew

### Phase 5 — Apple Disease Resistance JSONB Keys

```json
{
  "apple_scab": "immune|resistant|moderate|susceptible",
  "fire_blight": "resistant|moderate|susceptible",
  "cedar_apple_rust": "resistant|moderate|susceptible",
  "powdery_mildew": "resistant|moderate|susceptible",
  "bitter_rot": "resistant|moderate|susceptible",
  "sooty_blotch_flyspeck": "resistant|moderate|susceptible"
}
```

---

## Migration Deployment Order

Before any new genus data can use growing profiles, pollination, etc., we need to deploy the Wave 4 migrations:

1. **Migration 002** — taxonomy_nodes (already designed in KNOWLEDGE_GRAPH_SCHEMA.md)
2. **Migration 003** — species_growing_profiles
3. **Migration 004** — species_pollination_profiles, pollination_groups, cultivar_pollination_groups, pollination_compatibility
4. **Migration 005** — cultivar_traits, rootstock_compatibility

These should be deployed first, then genus data can flow in.

---

## Deliverable Format Per Genus

Each genus buildout produces:

1. **`data/{genus}_canonical_entities_v1.json`** — Same format as hazelnut file (plant_entities, cultivars, named_materials, populations, controlled_vocabularies)
2. **`sql/seed_{genus}.sql`** — INSERT statements for all the above, plus growing profiles, pollination data, cultivar traits
3. **Updated `lib/genus-names.ts`** — If adding new genera not already listed
4. **Updated aliases** — All discovered name variants

---

## Tracking Completeness

For each genus, track completion across these dimensions:

| Dimension | Hazelnut | Apple | Chestnut | Walnut | ... |
|-----------|----------|-------|----------|--------|-----|
| Species identified | ✅ | ⬜ | ⬜ | ⬜ | |
| Cultivars cataloged | ✅ | ⬜ | ⬜ | ⬜ | |
| Aliases mapped | ✅ | ⬜ | ⬜ | ⬜ | |
| Growing profiles | ✅ | ⬜ | ⬜ | ⬜ | |
| Pollination data | 🟨 | ⬜ | ⬜ | ⬜ | |
| Cultivar traits | ⬜ | ⬜ | ⬜ | ⬜ | |
| Rootstock compat | N/A | ⬜ | ⬜ | ⬜ | |
| Nursery offers linked | ✅ | ⬜ | ⬜ | ⬜ | |
| QA verified | ✅ | ⬜ | ⬜ | ⬜ | |

✅ = Complete  🟨 = Partial  ⬜ = Not started  N/A = Not applicable

---

## Recommended Workflow

1. **Deploy Wave 4 migrations** to Supabase (one-time, enables all new data)
2. **Start with Malus (Apple)** — highest user demand, well-documented
3. Work through one genus at a time: research → JSON → SQL → deploy → verify
4. After each genus, refresh the materialized search index
5. After 2-3 genera, revisit the data schema to see if any fields are consistently missing or unnecessary
6. Add Vaccinium, Rubus, Ribes to the genus list when ready (not in current taxonomy seed)
