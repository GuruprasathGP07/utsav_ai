import { describe, it, expect } from 'vitest';
import {
  parseINR,
  formatINR,
  formatINRCompact,
  largestRemainder,
  assertSum,
} from '../../src/engine/money.js';

describe('money engine', () => {
  describe('parseINR', () => {
    it('parses "8 lakh", "8L", "8.5 lac", "2 crore"', () => {
      expect(parseINR('8 lakh')).toBe(800_000);
      expect(parseINR('8L')).toBe(800_000);
      expect(parseINR('8.5 lac')).toBe(850_000);
      expect(parseINR('2 crore')).toBe(20_000_000);
      expect(parseINR('2.5 cr')).toBe(25_000_000);
    });

    it('parses formatted rupee numbers: "8,00,000", "Rs 800000", "₹8,00,000"', () => {
      expect(parseINR('8,00,000')).toBe(800_000);
      expect(parseINR('Rs 800000')).toBe(800_000);
      expect(parseINR('₹8,00,000')).toBe(800_000);
      expect(parseINR('50,000')).toBe(50_000);
      expect(parseINR('50k')).toBe(50_000);
    });

    it('returns null on invalid input', () => {
      expect(parseINR('')).toBeNull();
      expect(parseINR('free')).toBeNull();
      expect(parseINR('abc')).toBeNull();
    });
  });

  describe('formatINR', () => {
    it('formats numbers to Indian grouped rupees with ₹ symbol', () => {
      expect(formatINR(800_000)).toBe('₹8,00,000');
      expect(formatINR(50_000)).toBe('₹50,000');
      expect(formatINR(10_000_000)).toBe('₹1,00,00,000');
      expect(formatINR(0)).toBe('₹0');
    });
  });

  describe('formatINRCompact', () => {
    it('formats compact representations (L, Cr, K)', () => {
      expect(formatINRCompact(800_000)).toBe('₹8L');
      expect(formatINRCompact(850_000)).toBe('₹8.5L');
      expect(formatINRCompact(15_000_000)).toBe('₹1.5Cr');
      expect(formatINRCompact(45_000)).toBe('₹45K');
    });
  });

  describe('largestRemainder', () => {
    it('allocates fractions so the exact sum matches target integer', () => {
      const weights = [
        { key: 'a', percent: 33.3333 },
        { key: 'b', percent: 33.3333 },
        { key: 'c', percent: 33.3334 },
      ];
      const target = 100;
      const rounded = largestRemainder(target, weights);
      const sum = rounded.reduce((a, b) => a + b.amount, 0);
      expect(sum).toBe(target);
      expect(() => assertSum(target, rounded.map(r => r.amount))).not.toThrow();
    });

    it('handles empty weights', () => {
      const rounded = largestRemainder(100, []);
      expect(rounded).toEqual([]);
    });
  });
});
