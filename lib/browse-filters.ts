import type {
  TaxonomyTree,
  TaxonomyTreeCategory,
  TaxonomyTreeGenus,
  TaxonomyTreePlant,
} from '@/lib/queries/taxonomy-tree';
import type { StockTypeFilter } from '@/lib/zone-persistence';

// ---------------------------------------------------------------------------
// Filter state — extensible for future filters
// ---------------------------------------------------------------------------

export interface BrowseFilters {
  zoneMin?: number;
  zoneMax?: number;
  stockType?: StockTypeFilter;
  forSaleNow?: boolean;
}

export function hasActiveFilters(filters: BrowseFilters): boolean {
  return (
    filters.zoneMin != null ||
    filters.zoneMax != null ||
    (filters.stockType != null && filters.stockType !== 'either') ||
    filters.forSaleNow === true
  );
}

// ---------------------------------------------------------------------------
// Stock type matching
// ---------------------------------------------------------------------------

const PLANT_SALE_FORMS = new Set(['bare_root', 'potted', 'cutting', 'grafted']);

function plantMatchesStockType(
  plant: TaxonomyTreePlant,
  stockType?: StockTypeFilter
): boolean {
  if (!stockType || stockType === 'either') return true;
  if (stockType === 'seed') return plant.sale_forms.includes('seed');
  // 'plant' matches bare_root, potted, cutting, grafted
  return plant.sale_forms.some((f) => PLANT_SALE_FORMS.has(f));
}

// ---------------------------------------------------------------------------
// Zone overlap check
// ---------------------------------------------------------------------------

function plantMatchesZone(
  plant: TaxonomyTreePlant,
  zoneMin?: number,
  zoneMax?: number
): boolean {
  if (zoneMin == null && zoneMax == null) return true;
  if (plant.zone_min == null || plant.zone_max == null) return true;

  const selMin = zoneMin ?? 1;
  const selMax = zoneMax ?? 13;

  return plant.zone_min <= selMax && plant.zone_max >= selMin;
}

// ---------------------------------------------------------------------------
// Filter the full taxonomy tree client-side
// ---------------------------------------------------------------------------

export function filterTaxonomyTree(
  tree: TaxonomyTree,
  filters: BrowseFilters
): TaxonomyTree {
  if (!hasActiveFilters(filters)) return tree;

  let totalSpecies = 0;
  let totalCultivars = 0;

  const categories: TaxonomyTreeCategory[] = [];

  for (const cat of tree.categories) {
    const genera: TaxonomyTreeGenus[] = [];

    for (const genus of cat.genera) {
      const matchingPlants = genus.plants.filter((p) => {
        if (!plantMatchesZone(p, filters.zoneMin, filters.zoneMax)) return false;
        if (filters.forSaleNow && !p.has_stock) return false;
        if (!plantMatchesStockType(p, filters.stockType)) return false;
        return true;
      });

      if (matchingPlants.length === 0) continue;

      genera.push({
        ...genus,
        species_count: matchingPlants.length,
        cultivar_count: matchingPlants.reduce((s, p) => s + p.cultivar_count, 0),
        has_stock: matchingPlants.some((p) => p.has_stock),
        plants: matchingPlants,
      });
    }

    if (genera.length === 0) continue;

    const catSpecies = genera.reduce((s, g) => s + g.species_count, 0);
    const catCultivars = genera.reduce((s, g) => s + g.cultivar_count, 0);
    totalSpecies += catSpecies;
    totalCultivars += catCultivars;

    categories.push({
      ...cat,
      genera,
      total_species: catSpecies,
      total_cultivars: catCultivars,
    });
  }

  return { categories, total_species: totalSpecies, total_cultivars: totalCultivars };
}
