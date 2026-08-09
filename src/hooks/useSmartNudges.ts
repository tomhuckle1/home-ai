import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/src/lib/supabase';

export type SmartNudge = {
  id: string;
  icon: string;
  title: string;
  description: string;
  tone: 'warning' | 'info' | 'tip';
  action?: { label: string; route: string; params?: Record<string, string> };
};

export function useSmartNudges(propertyId: string | undefined) {
  return useQuery<SmartNudge[]>({
    queryKey: ['smart-nudges', propertyId],
    enabled: !!propertyId,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const nudges: SmartNudge[] = [];

      // Fetch all relevant data in parallel
      const [assetsRes, maintenanceRes, insuranceRes, vehiclesRes] = await Promise.all([
        supabase.from('assets').select('id, name, category, warranty_expiry, attributes, created_at').eq('property_id', propertyId!).eq('status', 'active'),
        supabase.from('maintenance_tasks').select('id, title, next_due_date, asset_id, is_active').eq('property_id', propertyId!).eq('is_active', true),
        supabase.from('insurance_policies').select('id, policy_type, provider, renewal_date').eq('property_id', propertyId!),
        supabase.from('vehicles').select('id, make, model, registration, mot_expiry, tax_expiry, insurance_renewal, service_due_date').eq('property_id', propertyId!),
      ]);

      const assets = assetsRes.data ?? [];
      const maintenance = maintenanceRes.data ?? [];
      const insurance = insuranceRes.data ?? [];
      const vehicles = vehiclesRes.data ?? [];
      const now = Date.now();
      const daysUntil = (d: string | null) => d ? Math.ceil((new Date(d).getTime() - now) / 86400000) : null;

      // Overdue maintenance
      const overdue = maintenance.filter((t) => new Date(t.next_due_date) < new Date());
      if (overdue.length > 0) {
        nudges.push({
          id: 'overdue-maintenance',
          icon: '⚠️',
          title: `${overdue.length} overdue maintenance task${overdue.length === 1 ? '' : 's'}`,
          description: overdue.slice(0, 2).map((t) => t.title).join(', '),
          tone: 'warning',
        });
      }

      // Boiler service check
      const boilers = assets.filter((a) => a.category === 'heating');
      for (const boiler of boilers) {
        const lastService = (boiler.attributes as Record<string, unknown>)?.last_service as string | null;
        if (lastService) {
          const monthsAgo = (now - new Date(lastService).getTime()) / (1000 * 60 * 60 * 24 * 30);
          if (monthsAgo > 12) {
            nudges.push({
              id: `boiler-overdue-${boiler.id}`,
              icon: '🔥',
              title: `${boiler.name} service overdue`,
              description: `Last serviced ${Math.round(monthsAgo)} months ago. Annual servicing is recommended.`,
              tone: 'warning',
              action: { label: 'View', route: `/asset/${boiler.id}` },
            });
          }
        }
      }

      // Insurance renewals coming up
      for (const policy of insurance) {
        const days = daysUntil(policy.renewal_date);
        if (days !== null && days >= 0 && days <= 30) {
          nudges.push({
            id: `insurance-renewal-${policy.id}`,
            icon: '🔑',
            title: `${policy.policy_type.replace(/_/g, ' ')} insurance renews in ${days} days`,
            description: policy.provider ? `With ${policy.provider}` : 'Check your renewal terms',
            tone: days <= 7 ? 'warning' : 'info',
          });
        }
      }

      // Vehicle deadlines
      for (const v of vehicles) {
        const name = [v.make, v.model].filter(Boolean).join(' ') || v.registration || 'Vehicle';
        const motDays = daysUntil(v.mot_expiry);
        const taxDays = daysUntil(v.tax_expiry);
        const insDays = daysUntil(v.insurance_renewal);

        if (motDays !== null && motDays <= 30 && motDays >= 0) {
          nudges.push({ id: `mot-${v.id}`, icon: '🚗', title: `${name} MOT expires in ${motDays} days`, description: motDays <= 7 ? 'Book your MOT now' : 'Time to book your MOT', tone: motDays <= 7 ? 'warning' : 'info' });
        } else if (motDays !== null && motDays < 0) {
          nudges.push({ id: `mot-expired-${v.id}`, icon: '🚗', title: `${name} MOT has expired`, description: 'Your vehicle cannot legally be driven without a valid MOT', tone: 'warning' });
        }
        if (taxDays !== null && taxDays <= 14 && taxDays >= 0) {
          nudges.push({ id: `tax-${v.id}`, icon: '🚗', title: `${name} tax expires in ${taxDays} days`, description: 'Renew at gov.uk', tone: 'warning' });
        }
      }

      // Missing smoke alarms
      const hasSmokeAlarms = assets.some((a) => {
        const attrs = a.attributes as Record<string, unknown>;
        return a.category === 'security' && (attrs?.device_type === 'smoke_alarm_battery' || attrs?.device_type === 'smoke_alarm_sealed' || attrs?.device_type === 'smoke_alarm_hardwired');
      });
      if (!hasSmokeAlarms && assets.length > 3) {
        nudges.push({
          id: 'no-smoke-alarms',
          icon: '🛡️',
          title: 'No smoke alarms recorded',
          description: 'Every home should have working smoke alarms. Add yours to set battery reminders.',
          tone: 'tip',
          action: { label: 'Add', route: '/add' },
        });
      }

      // No insurance recorded
      if (insurance.length === 0 && assets.length > 3) {
        nudges.push({
          id: 'no-insurance',
          icon: '🔑',
          title: 'No insurance recorded',
          description: 'Add your home insurance to get renewal reminders.',
          tone: 'tip',
          action: { label: 'Add', route: '/add/insurance', params: { propertyId: propertyId! } },
        });
      }

      // Warranty expiring soon
      for (const asset of assets) {
        const days = daysUntil(asset.warranty_expiry);
        if (days !== null && days >= 0 && days <= 30) {
          nudges.push({
            id: `warranty-${asset.id}`,
            icon: '🛡️',
            title: `${asset.name} warranty expires in ${days} days`,
            description: 'Consider extending your warranty or noting this before it expires.',
            tone: 'info',
            action: { label: 'View', route: `/asset/${asset.id}` },
          });
        }
      }

      return nudges;
    },
  });
}
