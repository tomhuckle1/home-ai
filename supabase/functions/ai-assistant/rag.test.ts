import { buildAssistantRequestBody, normalizeAssistantResult } from './rag';

const assets = [
  {
    id: 'asset-1',
    name: 'Washing machine',
    category: 'appliance',
    brand: 'Bosch',
    model: 'WAU28T64GB',
    serial_number: 'SN123',
    warranty_expiry: '2026-01-01',
    purchase_date: '2024-01-01',
    notes: null,
  },
];

const documents = [
  {
    id: 'doc-1',
    document_type: 'receipt',
    supplier: 'Currys',
    product_description: 'Washing machine',
    document_date: '2024-01-01',
    expiry_date: null,
    amount: 499.99,
  },
];

describe('normalizeAssistantResult', () => {
  it('keeps a citation that references a real supplied id', () => {
    const result = normalizeAssistantResult(
      { answer: 'Yes, until 2026-01-01.', citations: [{ type: 'asset', id: 'asset-1', label: 'Washing machine' }] },
      assets,
      documents,
    );
    expect(result.citations).toHaveLength(1);
    expect(result.answer).toBe('Yes, until 2026-01-01.');
  });

  it('drops a citation referencing an id that was never supplied as context', () => {
    const result = normalizeAssistantResult(
      { answer: 'Yes.', citations: [{ type: 'asset', id: 'made-up-id', label: 'Fake' }] },
      assets,
      documents,
    );
    expect(result.citations).toHaveLength(0);
  });

  it('drops a citation with an invalid type', () => {
    const result = normalizeAssistantResult(
      { answer: 'Yes.', citations: [{ type: 'appliance', id: 'asset-1', label: 'x' }] },
      assets,
      documents,
    );
    expect(result.citations).toHaveLength(0);
  });

  it('falls back to a safe "don\'t know" answer when the model returns nothing usable', () => {
    const result = normalizeAssistantResult({}, assets, documents);
    expect(result.answer).toMatch(/don't have that information/i);
    expect(result.citations).toEqual([]);
  });

  it('never throws on malformed citations array', () => {
    expect(() => normalizeAssistantResult({ answer: 'x', citations: 'not-an-array' }, assets, documents)).not.toThrow();
  });
});

describe('buildAssistantRequestBody', () => {
  it('includes the question and context in the request', () => {
    const body = buildAssistantRequestBody('Is my washing machine under warranty?', assets, documents, [], 'gpt-4o-mini');
    const serialized = JSON.stringify(body);
    expect(serialized).toContain('Is my washing machine under warranty?');
    expect(serialized).toContain('Bosch');
    expect(serialized).toContain('Currys');
  });

  it('requests structured JSON output', () => {
    const body = buildAssistantRequestBody('question', assets, documents, [], 'gpt-4o-mini');
    expect(body.response_format.type).toBe('json_schema');
  });

  it('includes retrieved document excerpts when present', () => {
    const body = buildAssistantRequestBody(
      'question',
      assets,
      documents,
      [{ document_id: 'doc-1', content: 'Filter part number XF-100' }],
      'gpt-4o-mini',
    );
    expect(JSON.stringify(body)).toContain('XF-100');
  });
});
