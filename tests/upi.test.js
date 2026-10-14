import { describe, it, expect } from 'bun:test';
import { isValidUpiId, validateAmount, buildUpiUri, parseUpiUri } from '../utils/upi.js';

describe('UPI Utility Tests', () => {
  describe('isValidUpiId', () => {
    it('validates correct UPI IDs', () => {
      expect(isValidUpiId('merchant@icici')).toBe(true);
      expect(isValidUpiId('john.doe@okhdfcbank')).toBe(true);
      expect(isValidUpiId('9876543210@paytm')).toBe(true);
      expect(isValidUpiId('user_name-1@upi')).toBe(true);
      expect(isValidUpiId('  my-store@axisbank  ')).toBe(true);
    });

    it('rejects invalid UPI IDs', () => {
      expect(isValidUpiId('')).toBe(false);
      expect(isValidUpiId(null)).toBe(false);
      expect(isValidUpiId(undefined)).toBe(false);
      expect(isValidUpiId('nodomain')).toBe(false);
      expect(isValidUpiId('@bank')).toBe(false);
      expect(isValidUpiId('user@')).toBe(false);
      expect(isValidUpiId('user name@bank')).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('accepts empty/null/undefined amounts as optional', () => {
      expect(validateAmount('')).toEqual({ valid: true, value: undefined });
      expect(validateAmount(null)).toEqual({ valid: true, value: undefined });
      expect(validateAmount(undefined)).toEqual({ valid: true, value: undefined });
    });

    it('accepts valid positive numbers', () => {
      expect(validateAmount('10')).toEqual({ valid: true, value: 10 });
      expect(validateAmount('150.50')).toEqual({ valid: true, value: 150.5 });
      expect(validateAmount(500)).toEqual({ valid: true, value: 500 });
    });

    it('rejects zero or negative numbers', () => {
      expect(validateAmount('0').valid).toBe(false);
      expect(validateAmount('-50').valid).toBe(false);
      expect(validateAmount(0).valid).toBe(false);
    });

    it('rejects non-numeric values', () => {
      expect(validateAmount('abc').valid).toBe(false);
    });
  });

  describe('buildUpiUri', () => {
    it('throws error if upiId is missing', () => {
      expect(() => buildUpiUri({})).toThrow('UPI ID (pa) is required');
      expect(() => buildUpiUri({ upiId: '' })).toThrow('UPI ID (pa) is required');
    });

    it('generates minimal valid UPI URI without amount or note', () => {
      const uri = buildUpiUri({
        upiId: 'john@upi',
        name: 'John Doe',
      });

      expect(uri).toBe('upi://pay?pa=john%40upi&pn=John%20Doe&cu=INR');
      // Must NOT contain undefined
      expect(uri).not.toContain('undefined');
      expect(uri).not.toContain('am=');
      expect(uri).not.toContain('tn=');
    });

    it('includes amount formatted to 2 decimals when provided', () => {
      const uri = buildUpiUri({
        upiId: 'shop@icici',
        name: 'My Shop',
        amount: 250,
      });

      expect(uri).toBe('upi://pay?pa=shop%40icici&pn=My%20Shop&am=250.00&cu=INR');
    });

    it('includes note when provided and encodes properly', () => {
      const uri = buildUpiUri({
        upiId: 'shop@icici',
        name: 'My Shop & Café',
        amount: '120.5',
        note: 'Lunch + Drink',
      });

      expect(uri).toBe('upi://pay?pa=shop%40icici&pn=My%20Shop%20%26%20Caf%C3%A9&tn=Lunch%20%2B%20Drink&am=120.50&cu=INR');
      expect(uri).not.toContain('undefined');
    });

    it('omits am and tn if empty strings are passed', () => {
      const uri = buildUpiUri({
        upiId: 'alice@upi',
        name: 'Alice',
        amount: '',
        note: '',
      });

      expect(uri).toBe('upi://pay?pa=alice%40upi&pn=Alice&cu=INR');
      expect(uri).not.toContain('am=');
      expect(uri).not.toContain('tn=');
    });
  });

  describe('parseUpiUri', () => {
    it('round trips encoded parameters', () => {
      const original = {
        upiId: 'test@upi',
        name: 'Test User',
        amount: '500.00',
        note: 'Test note',
      };

      const uri = buildUpiUri(original);
      const parsed = parseUpiUri(uri);

      expect(parsed.upiId).toBe(original.upiId);
      expect(parsed.name).toBe(original.name);
      expect(parsed.amount).toBe(original.amount);
      expect(parsed.note).toBe(original.note);
      expect(parsed.currency).toBe('INR');
    });
  });
});
