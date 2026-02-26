import { describe, expect, it } from 'vitest';
import {
  normalizeReviewerNotes,
  parseLimit,
  parseListStatus,
  parseResolvedType,
  parseReviewStatus,
} from '@/lib/unmatched/admin';

describe('parseReviewStatus', () => {
  it('accepts valid statuses', () => {
    expect(parseReviewStatus('pending')).toBe('pending');
    expect(parseReviewStatus('resolved')).toBe('resolved');
    expect(parseReviewStatus('ignored')).toBe('ignored');
  });

  it('rejects invalid statuses', () => {
    expect(parseReviewStatus('bad')).toBeNull();
    expect(parseReviewStatus(null)).toBeNull();
  });
});

describe('parseResolvedType', () => {
  it('accepts valid resolved types', () => {
    expect(parseResolvedType('cultivar')).toBe('cultivar');
    expect(parseResolvedType('plant_entity')).toBe('plant_entity');
  });

  it('rejects invalid types', () => {
    expect(parseResolvedType('tree')).toBeNull();
  });
});

describe('parseListStatus', () => {
  it('defaults unknown values to all', () => {
    expect(parseListStatus(null)).toBe('all');
    expect(parseListStatus('all')).toBe('all');
    expect(parseListStatus('unknown')).toBe('all');
  });

  it('passes through known statuses', () => {
    expect(parseListStatus('pending')).toBe('pending');
  });
});

describe('parseLimit', () => {
  it('clamps values to bounds', () => {
    expect(parseLimit('0', 100, 1, 500)).toBe(1);
    expect(parseLimit('999', 100, 1, 500)).toBe(500);
    expect(parseLimit('20', 100, 1, 500)).toBe(20);
  });

  it('falls back for invalid input', () => {
    expect(parseLimit(null, 100)).toBe(100);
    expect(parseLimit('bad', 100)).toBe(100);
  });
});

describe('normalizeReviewerNotes', () => {
  it('trims and normalizes notes', () => {
    expect(normalizeReviewerNotes('  hello world  ')).toBe('hello world');
  });

  it('returns null for empty or non-string values', () => {
    expect(normalizeReviewerNotes('   ')).toBeNull();
    expect(normalizeReviewerNotes(42)).toBeNull();
  });

  it('truncates notes to max length', () => {
    const value = 'x'.repeat(20);
    expect(normalizeReviewerNotes(value, 5)).toBe('xxxxx');
  });
});
