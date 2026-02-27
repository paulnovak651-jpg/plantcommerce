import { NextResponse } from 'next/server';

/**
 * GET /api
 * API discovery endpoint — tells agents what endpoints exist.
 */
export async function GET() {
  return NextResponse.json({
    name: 'Plant Commerce API',
    version: '2.0',
    description:
      'Plant database and nursery inventory aggregator for the permaculture community. Search cultivars, compare nursery availability, find what you need.',
    base_url: 'https://plantcommerce.app/api',
    endpoints: {
      search: {
        url: '/api/search',
        method: 'GET',
        params: {
          q: 'string (required) — search query',
          limit: 'number (optional, default 20) — max results',
        },
        description:
          'Full-text search across plants, cultivars, and nurseries using trigram matching',
      },
      schema: {
        url: '/api/schema',
        method: 'GET',
        description:
          'Static schema metadata (tables, relationships, enums) for agents and integrations',
      },
      plant_species: {
        url: '/api/plants/{speciesSlug}',
        method: 'GET',
        example: '/api/plants/corylus-avellana',
        description:
          'Get species info with full cultivar list. Returns botanical data, cultivar count, and all child cultivars.',
      },
      cultivar_detail: {
        url: '/api/plants/{speciesSlug}/{cultivarSlug}',
        method: 'GET',
        example: '/api/plants/corylus-avellana/jefferson',
        description:
          'Get cultivar detail with active offers, aliases, and legal identifiers. Includes nursery availability and pricing.',
      },
      nurseries_list: {
        url: '/api/nurseries',
        method: 'GET',
        description: 'List all active nurseries with location and contact info',
      },
      nursery_detail: {
        url: '/api/nurseries/{nurserySlug}',
        method: 'GET',
        example: '/api/nurseries/burnt-ridge-nursery',
        description:
          'Get nursery details with current inventory offers, including cultivar links and pricing',
      },
      admin_unmatched_queue: {
        url: '/api/admin/unmatched',
        method: 'GET',
        auth: 'Bearer ADMIN_STATUS_SECRET (or CRON_SECRET fallback)',
        params: {
          status: 'pending | resolved | ignored | all (default all)',
          limit: 'number (optional, default 100, max 500)',
        },
        description:
          'Protected moderation queue endpoint for unresolved scraper names',
      },
      admin_unmatched_update: {
        url: '/api/admin/unmatched/{id}',
        method: 'PATCH',
        auth: 'Bearer ADMIN_STATUS_SECRET (or CRON_SECRET fallback)',
        description:
          'Protected endpoint to set unmatched review outcome (pending/resolved/ignored)',
      },
    },
    data_types: {
      plant_entity:
        'A species, hybrid, or species group (e.g., Corylus avellana = European Hazelnut)',
      cultivar:
        'A named plant variety — clones, seed strains, breeding populations',
      nursery: 'A business that sells plants',
      inventory_offer:
        'A current listing of a cultivar at a nursery, with price and availability',
    },
    discovery: {
      sitemap: '/sitemap.xml',
      robots: '/robots.txt',
      llms: '/llms.txt',
      llms_full: '/llms-full.txt',
    },
  });
}
