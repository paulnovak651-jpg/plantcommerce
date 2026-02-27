import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';
import { getPlantEntityBySlug, getCultivarsForSpecies } from '@/lib/queries/plants';
import { getGrowingProfile } from '@/lib/queries/growing';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const contentType = 'image/png';
export const size = {
  width: 1200,
  height: 630,
};

interface Props {
  params: Promise<{ speciesSlug: string }>;
}

export default async function Image({ params }: Props) {
  const { speciesSlug } = await params;
  const supabase = await createClient();
  const species = await getPlantEntityBySlug(supabase, speciesSlug);

  if (!species) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #f5f3ef 0%, #edeae4 100%)',
            color: '#1a1714',
            fontFamily: 'Satoshi, ui-sans-serif',
          }}
        >
          <div style={{ fontSize: 68, fontWeight: 700 }}>Plant Commerce</div>
          <div style={{ marginTop: 12, fontSize: 30, color: '#5c554b' }}>
            Species Not Found
          </div>
        </div>
      ),
      size
    );
  }

  const [growingProfile, cultivars] = await Promise.all([
    getGrowingProfile(supabase, species.id),
    getCultivarsForSpecies(supabase, species.id),
  ]);

  const zoneText =
    growingProfile?.usda_zone_min != null && growingProfile?.usda_zone_max != null
      ? `Zone ${growingProfile.usda_zone_min}-${growingProfile.usda_zone_max}`
      : 'Zone data pending';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #f5f3ef 0%, #faf9f7 50%, #edeae4 100%)',
          color: '#1a1714',
          padding: '56px',
          fontFamily: 'Satoshi, ui-sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            maxWidth: '900px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              background: '#d8f3dc',
              color: '#2d6a4f',
              fontSize: 30,
              fontWeight: 700,
              borderRadius: 999,
              padding: '10px 22px',
            }}
          >
            {zoneText}
          </div>

          <div style={{ fontSize: 82, fontWeight: 700, lineHeight: 1.05 }}>
            {species.canonical_name}
          </div>

          <div style={{ fontSize: 42, color: '#5c554b', fontStyle: 'italic' }}>
            {species.botanical_name}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: 34, color: '#5c554b' }}>
            {cultivars.length} cultivar{cultivars.length === 1 ? '' : 's'}
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: '#2d6a4f' }}>
            Plant Commerce
          </div>
        </div>
      </div>
    ),
    size
  );
}
