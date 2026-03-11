import type { GrowingProfile } from '@/lib/types';

interface QuickFactsHeroProps {
  profile: GrowingProfile | null;
  pollinationType?: string | null;
}

interface QuickFact {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const RulerIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 6v4M10 6v2M14 6v4M18 6v2" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const MapPinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const WindIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.7 7.7a2.5 2.5 0 111.8 4.3H2" /><path d="M9.6 4.6A2 2 0 1111 8H2" /><path d="M12.6 19.4A2 2 0 1014 16H2" />
  </svg>
);

export function QuickFactsHero({ profile, pollinationType }: QuickFactsHeroProps) {
  if (!profile) return null;

  const facts: QuickFact[] = [];

  if (profile.usda_zone_min != null && profile.usda_zone_max != null) {
    facts.push({
      icon: <MapPinIcon />,
      label: 'Zones',
      value: `${profile.usda_zone_min}\u2013${profile.usda_zone_max}`,
    });
  }

  if (profile.mature_height_min_ft != null || profile.mature_height_max_ft != null) {
    const min = profile.mature_height_min_ft;
    const max = profile.mature_height_max_ft;
    const value = min != null && max != null ? `${min}\u2013${max} ft` : `${min ?? max} ft`;
    facts.push({ icon: <RulerIcon />, label: 'Height', value });
  }

  if (profile.sun_requirement) {
    facts.push({
      icon: <SunIcon />,
      label: 'Sun',
      value: profile.sun_requirement.replace(/_/g, ' '),
    });
  }

  if (profile.harvest_season) {
    facts.push({
      icon: <CalendarIcon />,
      label: 'Harvest',
      value: profile.harvest_season.replace(/_/g, ' '),
    });
  }

  if (profile.years_to_bearing_min != null || profile.years_to_bearing_max != null) {
    const min = profile.years_to_bearing_min;
    const max = profile.years_to_bearing_max;
    const value = min != null && max != null ? `${min}\u2013${max} yrs` : `${min ?? max} yrs`;
    facts.push({ icon: <ClockIcon />, label: 'Bearing', value });
  }

  if (pollinationType) {
    facts.push({
      icon: <WindIcon />,
      label: 'Pollination',
      value: pollinationType.replace(/_/g, ' '),
    });
  }

  if (facts.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-lg)] bg-accent-hover/15 p-3 sm:grid-cols-3 lg:grid-cols-6">
      {facts.map((f) => (
        <div key={f.label} className="flex items-center gap-2">
          <span className="shrink-0 text-surface-raised/70">{f.icon}</span>
          <div className="min-w-0">
            <div className="text-[9px] font-medium uppercase tracking-wider text-surface-raised/50">
              {f.label}
            </div>
            <div className="text-[13px] font-semibold text-surface-raised truncate">
              {f.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
