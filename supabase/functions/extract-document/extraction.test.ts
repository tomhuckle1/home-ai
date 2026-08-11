import { buildEmbeddingInput, buildOpenAiRequestBody, errorMessage, normalizeExtractionResult } from './extraction';

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

describe('buildEmbeddingInput', () => {
  it('includes every populated field, human-readable', () => {
    const input = buildEmbeddingInput(
      normalizeExtractionResult({
        document_type: 'receipt',
        brand: 'Bosch',
        model: 'SMS4HVW33G',
        product_description: 'Dishwasher',
        supplier: 'Currys',
        amount: 429.99,
        currency: 'GBP',
        document_date: '2024-03-15',
        expiry_date: null,
      }),
    );

    expect(input).toContain('Brand: Bosch');
    expect(input).toContain('Model: SMS4HVW33G');
    expect(input).toContain('Item: Dishwasher');
    expect(input).toContain('Supplier: Currys');
    expect(input).toContain('Amount: GBP 429.99');
    expect(input).not.toContain('Expiry');
  });

  it('never produces an empty string, even with nothing extracted', () => {
    const input = buildEmbeddingInput(normalizeExtractionResult({}));
    expect(input.length).toBeGreaterThan(0);
    expect(input).toContain('Document type: other');
  });
});

describe('errorMessage', () => {
  it('reads .message off a real Error', () => {
    expect(errorMessage(new Error('boom'))).toBe('boom');
  });

  it('reads .message off a plain error-shaped object (e.g. a PostgrestError)', () => {
    expect(errorMessage({ message: 'permission denied for table documents', code: '42501' })).toBe(
      'permission denied for table documents',
    );
  });

  it('passes through a raw thrown string', () => {
    expect(errorMessage('something broke')).toBe('something broke');
  });

  it('stringifies an object with no usable message rather than hiding it', () => {
    expect(errorMessage({ code: 'PGRST301' })).toBe('{"code":"PGRST301"}');
  });

  it('falls back to a generic message only when there is truly nothing to show', () => {
    expect(errorMessage(null)).toBe('Unknown extraction error');
    expect(errorMessage(undefined)).toBe('Unknown extraction error');
    expect(errorMessage('')).toBe('Unknown extraction error');
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
