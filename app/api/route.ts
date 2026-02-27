import { NextResponse } from 'next/server';

/**
 * GET /api
 * API discovery endpoint listing available routes and query contracts.
 */
export async function GET() {
  return NextResponse.json({
    name: 'Plant Commerce API',
    version: '2.1',
    description:
      'Plant database and nursery inventory aggregator for the permaculture community.',
    base_url: 'https://plantcommerce.app/api',
    endpoints: {
      search: {
        url: '/api/search',
        method: 'GET',
        params: {
          q: 'string (required) - search query',
          zone: 'number (optional, 1-13) - USDA zone filter',
          category: 'string (optional) - display category filter',
          inStock: 'boolean (optional) - active offers only',
          limit: 'number (optional, default 20, max 100) - page size',
          offset: 'number (optional, default 0) - page offset',
        },
        description: 'Full-text search across plants and cultivars',
      },
      schema: {
        url: '/api/schema',
        method: 'GET',
        description: 'Static schema metadata for agents and integrations',
      },
      plant_species: {
        url: '/api/plants/{speciesSlug}',
        method: 'GET',
        example: '/api/plants/corylus-avellana',
        params: {
          fields: 'csv (optional) e.g. canonical_name,cultivars.canonical_name',
          limit: 'number (optional, default 20, max 100) - cultivar page size',
          offset: 'number (optional, default 0) - cultivar offset',
        },
        description:
          'Get species details with cultivar list. Supports sparse fieldsets and pagination.',
      },
      cultivar_detail: {
        url: '/api/plants/{speciesSlug}/{cultivarSlug}',
        method: 'GET',
        example: '/api/plants/corylus-avellana/jefferson',
        params: {
          fields: 'csv (optional) e.g. canonical_name,offers.raw_price_text',
          limit: 'number (optional, default 20, max 100) - offers page size',
          offset: 'number (optional, default 0) - offers offset',
        },
        description:
          'Get cultivar details with offers, aliases, and legal identifiers.',
      },
      nurseries_list: {
        url: '/api/nurseries',
        method: 'GET',
        params: {
          limit: 'number (optional, default 20, max 100) - page size',
          offset: 'number (optional, default 0) - page offset',
        },
        description: 'List active nurseries with offer counts',
      },
      nursery_detail: {
        url: '/api/nurseries/{nurserySlug}',
        method: 'GET',
        example: '/api/nurseries/burnt-ridge-nursery',
        params: {
          limit: 'number (optional, default 20, max 100) - inventory page size',
          offset: 'number (optional, default 0) - inventory offset',
        },
        description: 'Get nursery details with paginated inventory offers',
      },
      listings: {
        url: '/api/listings',
        method: 'GET',
        params: {
          cultivarId: 'uuid (required if plantEntityId is missing)',
          plantEntityId: 'uuid (required if cultivarId is missing)',
          limit: 'number (optional, default 20, max 100) - page size',
          offset: 'number (optional, default 0) - page offset',
        },
        description: 'List approved community listings',
      },
      alerts_create: {
        url: '/api/alerts',
        method: 'POST',
        description: 'Create an email stock alert for a cultivar or species',
      },
      admin_unmatched_queue: {
        url: '/api/admin/unmatched',
        method: 'GET',
        auth: 'Bearer ADMIN_STATUS_SECRET (or CRON_SECRET fallback)',
        params: {
          status: 'pending | resolved | ignored | all (default all)',
          limit: 'number (optional, default 100, max 500)',
          offset: 'number (optional, default 0)',
        },
        description: 'Protected moderation queue endpoint',
      },
      admin_unmatched_update: {
        url: '/api/admin/unmatched/{id}',
        method: 'PATCH',
        auth: 'Bearer ADMIN_STATUS_SECRET (or CRON_SECRET fallback)',
        description: 'Protected endpoint to set unmatched review outcome',
      },
    },
    discovery: {
      sitemap: '/sitemap.xml',
      feed: '/feed.xml',
      robots: '/robots.txt',
      llms: '/llms.txt',
      llms_full: '/llms-full.txt',
    },
  });
}
