const STORAGE_KEY = 'plantcommerce-user-zone';
const STOCK_TYPE_KEY = 'pc-stock-type';
const FOR_SALE_KEY = 'pc-for-sale-now';

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

// ---------------------------------------------------------------------------
// Stock type filter
// ---------------------------------------------------------------------------

export type StockTypeFilter = 'either' | 'seed' | 'plant';

export function getStockType(): StockTypeFilter {
  if (typeof window === 'undefined') return 'either';
  try {
    const val = localStorage.getItem(STOCK_TYPE_KEY);
    if (val === 'seed' || val === 'plant') return val;
    return 'either';
  } catch {
    return 'either';
  }
}

export function setStockType(value: StockTypeFilter): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STOCK_TYPE_KEY, value);
  } catch {}
}

// ---------------------------------------------------------------------------
// For sale now toggle
// ---------------------------------------------------------------------------

export function getForSaleNow(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(FOR_SALE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setForSaleNow(value: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FOR_SALE_KEY, String(value));
  } catch {}
}
