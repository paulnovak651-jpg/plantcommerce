/**
 * Query parser ported from PlantFinder.
 * Extracts intent, filters, and clean plant terms from a raw search string.
 */

export interface ParsedQuery {
  rawQuery: string;
  plantTerms: string[];
  zipCode?: string;
  stateFilter?: string;
  listingType?: 'scion' | 'rootstock' | 'tree' | 'plant' | 'cutting' | 'seed';
  edibleOnly: boolean;
  shippingOnly: boolean;
  localOnly: boolean;
  selfFertileOnly: boolean;
  useTagFilters: string[];
  zoneFilter?: number;
}

const STOP_WORDS = new Set([
  'a','an','the','and','or','for','of','in','at','to','i',
  'want','looking','find','buy','get','need','some','any',
  'where','can','my','zone','near','me','local','online',
  'ship','shipping','please','thanks','help',
  'good','best','great','nice',
]);

const LISTING_TYPE_MAP: Record<string, ParsedQuery['listingType']> = {
  scion: 'scion', scionwood: 'scion', scions: 'scion', budwood: 'scion',
  rootstock: 'rootstock', rootstocks: 'rootstock', understory: 'rootstock',
  tree: 'tree', trees: 'tree', bare: 'tree', 'bare-root': 'tree',
  cutting: 'cutting', cuttings: 'cutting', hardwood: 'cutting',
  seed: 'seed', seeds: 'seed',
  plant: 'plant', plants: 'plant', seedling: 'plant', seedlings: 'plant',
  plug: 'plant', plugs: 'plant',
};

const USE_TAG_WORDS: Record<string, string> = {
  cider: 'cider', juice: 'juice', jam: 'jam', jelly: 'jam',
  fresh: 'fresh eating', 'fresh eating': 'fresh eating',
  cooking: 'cooking', drying: 'drying', wine: 'wine',
  ornamental: 'ornamental', wildlife: 'wildlife', perry: 'perry',
};

const US_STATES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV',
  'NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN',
  'TX','UT','VT','VA','WA','WV','WI','WY',
]);

export function parseQuery(raw: string): ParsedQuery {
  const lower = raw.toLowerCase().trim();
  const tokens = lower.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);

  const result: ParsedQuery = {
    rawQuery: raw,
    plantTerms: [],
    edibleOnly: false,
    shippingOnly: false,
    localOnly: false,
    selfFertileOnly: false,
    useTagFilters: [],
  };

  // Extract ZIP code
  const zipMatch = lower.match(/\b(\d{5})\b/);
  if (zipMatch) result.zipCode = zipMatch[1];

  // Extract zone number (e.g. "zone 6", "zone6", "z6")
  const zoneMatch = lower.match(/\bz(?:one)?\s*(\d{1,2})\b/);
  if (zoneMatch) {
    const z = parseInt(zoneMatch[1], 10);
    if (z >= 1 && z <= 13) result.zoneFilter = z;
  }

  // Boolean flags
  if (/\b(ship|ships|shipping|mail|online|nationwide)\b/.test(lower)) result.shippingOnly = true;
  if (/\b(local|nearby|near me|pickup|pick up)\b/.test(lower)) result.localOnly = true;
  if (/\b(self.fertil|self fertil)\b/.test(lower)) result.selfFertileOnly = true;
  if (/\b(edible|fruit|food|eat)\b/.test(lower)) result.edibleOnly = true;

  for (const token of tokens) {
    if (LISTING_TYPE_MAP[token]) {
      result.listingType = LISTING_TYPE_MAP[token];
      continue;
    }
    if (USE_TAG_WORDS[token]) {
      if (!result.useTagFilters.includes(USE_TAG_WORDS[token])) {
        result.useTagFilters.push(USE_TAG_WORDS[token]);
      }
      continue;
    }
    if (STOP_WORDS.has(token)) continue;
    if (/^\d+$/.test(token)) continue;

    // Only treat 2-letter tokens as state codes if they're valid states
    const upper = token.toUpperCase();
    if (token.length === 2 && US_STATES.has(upper)) {
      result.stateFilter = upper;
      continue;
    }

    result.plantTerms.push(token);
  }

  return result;
}
