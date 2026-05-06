import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInDays } from 'date-fns';

/**
 * Ringkasan kontrak MACET (status dinamis) — bukan returned.
 * Macet = kontrak masih aktif tapi telat parah berdasarkan rasio hari/angsuran.
 */
export interface MacetSummary {
  macet_count: number;
  total_outstanding: number; // sisa tagihan dari kontrak macet
  total_modal_at_risk: number; // modal yang masih nyangkut di kontrak macet
}

const calcDynamicStatus = (c: any): 'completed' | 'lancar' | 'kurang_lancar' | 'macet' => {
  if (c.status === 'completed') return 'completed';
  const daysSinceCreation = differenceInDays(new Date(), new Date(c.created_at));
  const installmentsPaid = c.current_installment_index || 0;
  if (installmentsPaid === 0) {
    return daysSinceCreation > 7 ? 'macet' : daysSinceCreation > 3 ? 'kurang_lancar' : 'lancar';
  }
  const ratio = daysSinceCreation / installmentsPaid;
  if (ratio <= 1.2) return 'lancar';
  if (ratio <= 2.0) return 'kurang_lancar';
  return 'macet';
};

const fetchMacet = async (rangeStart: string, rangeEnd: string): Promise<MacetSummary> => {
  const { data: contracts, error } = await supabase
    .from('credit_contracts')
    .select('id, omset, total_loan_amount, daily_installment_amount, tenor_days, start_date, status, current_installment_index, created_at')
    .neq('status', 'returned')
    .neq('status', 'completed')
    .gte('start_date', rangeStart)
    .lte('start_date', rangeEnd);
  if (error) throw error;

  const macetContracts = (contracts || []).filter((c: any) => calcDynamicStatus(c) === 'macet');
  const ids = macetContracts.map((c: any) => c.id);

  const paidMap = new Map<string, number>();
  if (ids.length > 0) {
    const { data: payments, error: pErr } = await supabase
      .from('payment_logs')
      .select('contract_id, amount_paid')
      .in('contract_id', ids);
    if (pErr) throw pErr;
    (payments || []).forEach((p: any) => {
      paidMap.set(p.contract_id, (paidMap.get(p.contract_id) || 0) + Number(p.amount_paid || 0));
    });
  }

  let total_outstanding = 0;
  let total_modal_at_risk = 0;
  macetContracts.forEach((c: any) => {
    const contractTotal = Number(c.daily_installment_amount || 0) * Number(c.tenor_days || 0);
    const paid = paidMap.get(c.id) || 0;
    total_outstanding += Math.max(0, contractTotal - paid);
    total_modal_at_risk += Number(c.omset || 0);
  });

  return {
    macet_count: macetContracts.length,
    total_outstanding,
    total_modal_at_risk,
  };
};

export const useMacetSummary = (month: Date = new Date()) => {
  const s = format(startOfMonth(month), 'yyyy-MM-dd');
  const e = format(endOfMonth(month), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['macet_summary', s, e],
    queryFn: () => fetchMacet(s, e),
  });
};

export const useMacetSummaryYearly = (year: Date = new Date()) => {
  const s = format(startOfYear(year), 'yyyy-MM-dd');
  const e = format(endOfYear(year), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['macet_summary_yearly', s, e],
    queryFn: () => fetchMacet(s, e),
  });
};
