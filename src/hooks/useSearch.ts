import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

export type SearchResultType = 'property' | 'room' | 'asset' | 'document' | 'timeline' | 'contractor';

export type SearchResult = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string | null;
  icon: string;
};

export function useGlobalSearch(query: string, householdProperties: string[]) {
  return useQuery<SearchResult[]>({
    queryKey: ['global-search', query],
    enabled: query.trim().length >= 2 && householdProperties.length > 0,
    queryFn: async () => {
      const term = `%${query.trim()}%`;
      const results: SearchResult[] = [];

      const [assets, documents, rooms, timeline, contractors] = await Promise.all([
        supabase
          .from('assets')
          .select('id, name, brand, model, category')
          .in('property_id', householdProperties)
          .or(`name.ilike.${term},brand.ilike.${term},model.ilike.${term}`)
          .limit(10),
        supabase
          .from('documents')
          .select('id, product_description, supplier, document_type, brand')
          .in('property_id', householdProperties)
          .or(`product_description.ilike.${term},supplier.ilike.${term},brand.ilike.${term}`)
          .limit(10),
        supabase
          .from('rooms')
          .select('id, name, room_type')
          .in('property_id', householdProperties)
          .ilike('name', term)
          .limit(5),
        supabase
          .from('timeline_events')
          .select('id, title, event_type, event_date')
          .in('property_id', householdProperties)
          .ilike('title', term)
          .limit(10),
        supabase
          .from('contractors')
          .select('id, name, trade')
          .in('property_id', householdProperties)
          .or(`name.ilike.${term},trade.ilike.${term}`)
          .limit(5),
      ]);

      if (assets.data) {
        for (const a of assets.data) {
          results.push({
            id: a.id,
            type: 'asset',
            title: a.name,
            subtitle: [a.brand, a.model].filter(Boolean).join(' · ') || a.category,
            icon: '📦',
          });
        }
      }

      if (documents.data) {
        for (const d of documents.data) {
          results.push({
            id: d.id,
            type: 'document',
            title: d.product_description || d.document_type.replace(/_/g, ' '),
            subtitle: d.supplier,
            icon: '📄',
          });
        }
      }

      if (rooms.data) {
        for (const r of rooms.data) {
          results.push({
            id: r.id,
            type: 'room',
            title: r.name,
            subtitle: r.room_type,
            icon: '🚪',
          });
        }
      }

      if (timeline.data) {
        for (const t of timeline.data) {
          results.push({
            id: t.id,
            type: 'timeline',
            title: t.title,
            subtitle: t.event_date,
            icon: '🕓',
          });
        }
      }

      if (contractors.data) {
        for (const c of contractors.data) {
          results.push({
            id: c.id,
            type: 'contractor',
            title: c.name,
            subtitle: c.trade,
            icon: '🔧',
          });
        }
      }

      return results;
    },
    staleTime: 30_000,
  });
}
