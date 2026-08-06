import { buildOpenAiRequestBody, normalizeExtractionResult } from './extraction';

describe('normalizeExtractionResult', () => {
  it('passes through a fully well-formed result', () => {
    const result = normalizeExtractionResult({
      document_type: 'receipt',
      supplier: 'Currys',
      product_description: 'Bosch dishwasher',
      brand: 'Bosch',
      model: 'SMS4HVW33G',
      serial_number: 'ABC123',
      amount: 429.99,
      currency: 'GBP',
      document_date: '2024-03-15',
      expiry_date: '2026-03-15',
    });

    expect(result).toEqual({
      document_type: 'receipt',
      supplier: 'Currys',
      product_description: 'Bosch dishwasher',
      brand: 'Bosch',
      model: 'SMS4HVW33G',
      serial_number: 'ABC123',
      amount: 429.99,
      currency: 'GBP',
      document_date: '2024-03-15',
      expiry_date: '2026-03-15',
    });
  });

  it('falls back document_type to "other" for anything outside the allowed enum', () => {
    const result = normalizeExtractionResult({ document_type: 'made_up_type' });
    expect(result.document_type).toBe('other');
  });

  it('never throws on a completely empty or malformed object', () => {
    expect(() => normalizeExtractionResult({})).not.toThrow();
    expect(() => normalizeExtractionResult({ amount: 'lots', document_date: 42 })).not.toThrow();
  });

  it('rejects a partial/ambiguous date rather than guessing', () => {
    const result = normalizeExtractionResult({ document_date: '2024-03', expiry_date: 'next spring' });
    expect(result.document_date).toBeNull();
    expect(result.expiry_date).toBeNull();
  });

  it('rejects a negative or non-finite amount instead of storing nonsense', () => {
    expect(normalizeExtractionResult({ amount: -50 }).amount).toBeNull();
    expect(normalizeExtractionResult({ amount: Infinity }).amount).toBeNull();
    expect(normalizeExtractionResult({ amount: Number.NaN }).amount).toBeNull();
  });

  it('rounds amount to 2 decimal places', () => {
    expect(normalizeExtractionResult({ amount: 19.999 }).amount).toBe(20);
    expect(normalizeExtractionResult({ amount: 19.994 }).amount).toBe(19.99);
  });

  it('treats blank strings the same as missing values', () => {
    const result = normalizeExtractionResult({ supplier: '   ', brand: '' });
    expect(result.supplier).toBeNull();
    expect(result.brand).toBeNull();
  });
});

describe('buildOpenAiRequestBody', () => {
  it('embeds the image URL and requested model', () => {
    const body = buildOpenAiRequestBody('https://example.com/photo.jpg', 'gpt-4o-mini');
    expect(body.model).toBe('gpt-4o-mini');
    expect(JSON.stringify(body)).toContain('https://example.com/photo.jpg');
  });

  it('requests structured JSON output', () => {
    const body = buildOpenAiRequestBody('https://example.com/photo.jpg', 'gpt-4o-mini');
    expect(body.response_format.type).toBe('json_schema');
  });
});
