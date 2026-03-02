import { haversine } from '@/lib/search/haversine';

describe('haversine', () => {
  it('returns 0 for the same point', () => {
    expect(haversine(0, 0, 0, 0)).toBe(0);
  });

  it('matches Portland to Seattle distance', () => {
    const distance = haversine(45.5152, -122.6784, 47.6062, -122.3321);
    expect(Math.abs(distance - 145)).toBeLessThanOrEqual(5);
  });

  it('matches NYC to LA distance', () => {
    const distance = haversine(40.7128, -74.006, 34.0522, -118.2437);
    expect(Math.abs(distance - 2451)).toBeLessThanOrEqual(10);
  });

  it('matches antipodal distance', () => {
    const distance = haversine(0, 0, 0, 180);
    expect(Math.abs(distance - 12451)).toBeLessThanOrEqual(50);
  });

  it('is symmetric', () => {
    const a = 45.5152;
    const b = -122.6784;
    const c = 47.6062;
    const d = -122.3321;
    expect(haversine(a, b, c, d)).toBeCloseTo(haversine(c, d, a, b), 10);
  });
});
