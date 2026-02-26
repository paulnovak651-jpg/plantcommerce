import { Surface } from './Surface';
import { Text } from './Text';
import { RangeBar } from './RangeBar';
import { IconRating } from './IconRating';

interface TraitGridProps {
  profile: {
    usda_zone_min?: number | null;
    usda_zone_max?: number | null;
    usda_zone_notes?: string | null;
    chill_hours_min?: number | null;
    chill_hours_max?: number | null;
    mature_height_min_ft?: number | null;
    mature_height_max_ft?: number | null;
    mature_spread_min_ft?: number | null;
    mature_spread_max_ft?: number | null;
    sun_requirement?: string | null;
    water_needs?: string | null;
    soil_ph_min?: number | null;
    soil_ph_max?: number | null;
    years_to_bearing_min?: number | null;
    years_to_bearing_max?: number | null;
    growth_rate?: string | null;
    native_range_description?: string | null;
  };
  compact?: boolean;
}

const SCALES = {
  zone: { min: 1, max: 13 },
  chill_hours: { min: 0, max: 2000 },
  height_ft: { min: 0, max: 80 },
  spread_ft: { min: 0, max: 60 },
  soil_ph: { min: 3.0, max: 9.0 },
  years_bearing: { min: 0, max: 15 },
};

const SUN_MAP: Record<string, number> = {
  full_sun: 4,
  full_to_partial: 3,
  partial_shade: 2,
  full_shade: 1,
};

const WATER_MAP: Record<string, number> = {
  low: 1,
  moderate: 2,
  high: 3,
  wet: 4,
};

const GROWTH_MAP: Record<string, number> = {
  slow: 1,
  moderate: 2,
  fast: 3,
  very_fast: 4,
};

function hasRange(min: number | null | undefined, max: number | null | undefined): boolean {
  return min != null && max != null;
}

export function TraitGrid({ profile, compact = false }: TraitGridProps) {
  const rangeItems: React.ReactNode[] = [];

  if (hasRange(profile.usda_zone_min, profile.usda_zone_max)) {
    rangeItems.push(
      <RangeBar
        key="zone"
        label="USDA Zone"
        scaleMin={SCALES.zone.min}
        scaleMax={SCALES.zone.max}
        valueMin={profile.usda_zone_min!}
        valueMax={profile.usda_zone_max!}
        note={profile.usda_zone_notes ?? undefined}
        color="green"
        compact={compact}
      />
    );
  }

  if (hasRange(profile.chill_hours_min, profile.chill_hours_max)) {
    rangeItems.push(
      <RangeBar
        key="chill"
        label="Chill Hours"
        scaleMin={SCALES.chill_hours.min}
        scaleMax={SCALES.chill_hours.max}
        valueMin={profile.chill_hours_min!}
        valueMax={profile.chill_hours_max!}
        unit="h"
        color="blue"
        compact={compact}
      />
    );
  }

  if (hasRange(profile.mature_height_min_ft, profile.mature_height_max_ft)) {
    rangeItems.push(
      <RangeBar
        key="height"
        label="Mature Height"
        scaleMin={SCALES.height_ft.min}
        scaleMax={SCALES.height_ft.max}
        valueMin={profile.mature_height_min_ft!}
        valueMax={profile.mature_height_max_ft!}
        unit="ft"
        compact={compact}
      />
    );
  }

  if (hasRange(profile.mature_spread_min_ft, profile.mature_spread_max_ft)) {
    rangeItems.push(
      <RangeBar
        key="spread"
        label="Mature Spread"
        scaleMin={SCALES.spread_ft.min}
        scaleMax={SCALES.spread_ft.max}
        valueMin={profile.mature_spread_min_ft!}
        valueMax={profile.mature_spread_max_ft!}
        unit="ft"
        compact={compact}
      />
    );
  }

  if (hasRange(profile.soil_ph_min, profile.soil_ph_max)) {
    rangeItems.push(
      <RangeBar
        key="ph"
        label="Soil pH"
        scaleMin={SCALES.soil_ph.min}
        scaleMax={SCALES.soil_ph.max}
        valueMin={profile.soil_ph_min!}
        valueMax={profile.soil_ph_max!}
        color="amber"
        compact={compact}
      />
    );
  }

  if (hasRange(profile.years_to_bearing_min, profile.years_to_bearing_max)) {
    rangeItems.push(
      <RangeBar
        key="bearing"
        label="Years to Bearing"
        scaleMin={SCALES.years_bearing.min}
        scaleMax={SCALES.years_bearing.max}
        valueMin={profile.years_to_bearing_min!}
        valueMax={profile.years_to_bearing_max!}
        unit="y"
        compact={compact}
      />
    );
  }

  const iconItems: React.ReactNode[] = [];

  if (profile.sun_requirement && SUN_MAP[profile.sun_requirement]) {
    iconItems.push(
      <IconRating
        key="sun"
        label="Sun"
        value={profile.sun_requirement}
        filled={SUN_MAP[profile.sun_requirement]}
        icon="sun"
      />
    );
  }

  if (profile.water_needs && WATER_MAP[profile.water_needs]) {
    iconItems.push(
      <IconRating
        key="water"
        label="Water"
        value={profile.water_needs}
        filled={WATER_MAP[profile.water_needs]}
        icon="water"
      />
    );
  }

  if (profile.growth_rate && GROWTH_MAP[profile.growth_rate]) {
    iconItems.push(
      <IconRating
        key="growth"
        label="Growth Rate"
        value={profile.growth_rate}
        filled={GROWTH_MAP[profile.growth_rate]}
        icon="growth"
      />
    );
  }

  if (rangeItems.length === 0 && iconItems.length === 0 && !profile.native_range_description) {
    return null;
  }

  return (
    <Surface elevation="raised" padding="compact">
      {rangeItems.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rangeItems}
        </div>
      )}

      {iconItems.length > 0 && (
        <div className={`flex flex-wrap gap-6 ${rangeItems.length > 0 ? 'mt-4' : ''}`}>
          {iconItems}
        </div>
      )}

      {profile.native_range_description && (
        <div className={rangeItems.length > 0 || iconItems.length > 0 ? 'mt-4' : ''}>
          <Text variant="caption" color="tertiary" className="block">
            Native Range
          </Text>
          <Text variant="sm" color="secondary">
            {profile.native_range_description}
          </Text>
        </div>
      )}
    </Surface>
  );
}
