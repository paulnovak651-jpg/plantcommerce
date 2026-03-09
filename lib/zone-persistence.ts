const STORAGE_KEY = 'plantcommerce-user-zone';

export function getUserZone(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const val = Number(raw);
    return val >= 1 && val <= 13 ? val : null;
  } catch {
    return null;
  }
}

export function setUserZone(zone: number): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, String(zone));
  } catch {
    // localStorage unavailable (private browsing, etc.)
  }
}

export function clearUserZone(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}
