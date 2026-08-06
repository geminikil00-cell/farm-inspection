import { describe, it, expect } from 'vitest';
import { calculateScore, getQuarterAndYear, getScoreColor } from '../utils/score';
import { classifyStatus, buildScoreMap, STATUS_LEVELS } from '../utils/status';

describe('calculateScore', () => {
  it('returns 0 for empty rows', () => {
    expect(calculateScore([])).toBe(0);
    expect(calculateScore(null)).toBe(0);
  });

  it('returns 100 for all excellent rows (built-in)', () => {
    const rows = [
      { criteria: 'Test 1', status: 'ممتاز', action: '', responsible: '' },
      { criteria: 'Test 2', status: 'ممتاز', action: '', responsible: '' },
    ];
    expect(calculateScore(rows)).toBe(100);
  });

  it('returns weighted average for mixed statuses', () => {
    const rows = [
      { criteria: 'A', status: 'ممتاز' },
      { criteria: 'B', status: 'سيء' },
    ];
    expect(calculateScore(rows)).toBe(50);
  });

  it('handles lakes multi-column (status_1 ... status_6)', () => {
    const rows = [
      { criteria: 'Pond test', status_1: 'ممتاز', status_2: 'جيد', status_3: 'سيء' },
    ];
    // (100 + 60 + 0) / 3 = 53
    expect(calculateScore(rows)).toBe(53);
  });

  it('handles custom template columns', () => {
    const columns = [
      { id: 'criteria', header: 'Criteria', type: 'label' },
      { id: 'col_1', header: 'Status', type: 'select', options: [
        { value: 'Good', label: 'Good', score: 100 },
        { value: 'Bad', label: 'Bad', score: 0 },
      ]},
      { id: 'col_2', header: 'Notes', type: 'textarea' },
    ];
    const rows = [
      { criteria: 'Test', col_1: 'Good', col_2: 'some notes' },
    ];
    expect(calculateScore(rows, columns)).toBe(100);
  });

  it('ignores columns with score: null', () => {
    const columns = [
      { id: 'col_1', header: 'Status', type: 'select', options: [
        { value: 'N/A', label: 'N/A', score: null },
        { value: 'Good', label: 'Good', score: 100 },
      ]},
    ];
    const rows = [{ col_1: 'N/A' }];
    expect(calculateScore(rows, columns)).toBe(0);
  });
});

describe('getQuarterAndYear', () => {
  it('returns current quarter for empty date', () => {
    const { quarter } = getQuarterAndYear('');
    expect(['Q1', 'Q2', 'Q3', 'Q4']).toContain(quarter);
  });

  it('parses valid date correctly', () => {
    const result = getQuarterAndYear('2026-01-15');
    expect(result).toEqual({ year: 2026, quarter: 'Q1' });
  });

  it('parses mid-year date correctly', () => {
    expect(getQuarterAndYear('2026-07-01').quarter).toBe('Q3');
    expect(getQuarterAndYear('2026-04-01').quarter).toBe('Q2');
    expect(getQuarterAndYear('2026-10-15').quarter).toBe('Q4');
  });
});

describe('getScoreColor', () => {
  it('returns green for >= 90', () => {
    expect(getScoreColor(90)).toBe('text-green-600');
    expect(getScoreColor(100)).toBe('text-green-600');
  });

  it('returns blue for 80-89', () => {
    expect(getScoreColor(80)).toBe('text-blue-600');
    expect(getScoreColor(85)).toBe('text-blue-600');
  });

  it('returns red for < 40', () => {
    expect(getScoreColor(0)).toBe('text-red-600');
    expect(getScoreColor(39)).toBe('text-red-600');
  });
});

describe('classifyStatus', () => {
  it('classifies known status values', () => {
    expect(classifyStatus('ممتاز')).toBe('EXCELLENT');
    expect(classifyStatus('جيد')).toBe('GOOD');
    expect(classifyStatus('سيء')).toBe('POOR');
    expect(classifyStatus('غير منطبق')).toBe('N_A');
  });

  it('returns null for unknown values', () => {
    expect(classifyStatus('')).toBe(null);
    expect(classifyStatus(null)).toBe(null);
    expect(classifyStatus('random text')).toBe(null);
  });
});

describe('buildScoreMap', () => {
  it('builds correct mapping from levels', () => {
    const levels = Object.values(STATUS_LEVELS).filter((s) => s.score != null);
    const map = buildScoreMap(levels);
    expect(map['ممتاز']).toBe(100);
    expect(map['جيد جداً']).toBe(80);
    expect(map['سيء']).toBe(0);
    expect(map['غير منطبق']).toBeUndefined();
  });
});
