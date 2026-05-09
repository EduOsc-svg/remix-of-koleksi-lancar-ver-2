import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

/**
 * Total DP = Penjumlahan pembayaran PERTAMA dari setiap kontrak yang
 * start_date-nya jatuh dalam periode (bulan / tahun). Kontrak status='returned' diabaikan.
 */
const fetchDpTotal = async (start: string, end: string): Promise<{ total_dp: number; contract_count: number }> => {
  const { data: contracts, error: cErr } = await supabase
    .from('credit_contracts')
    .select('id')
    .neq('status', 'returned')
    .gte('start_date', start)
    .lte('start_date', end);
  if (cErr) throw cErr;

  const ids = (contracts || []).map((c: any) => c.id);
  if (ids.length === 0) return { total_dp: 0, contract_count: 0 };

  const { data: payments, error: pErr } = await supabase
    .from('payment_logs')
    .select('contract_id, payment_date, amount_paid, created_at')
    .in('contract_id', ids)
    .order('payment_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (pErr) throw pErr;

  const firstByContract = new Map<string, number>();
  (payments || []).forEach((p: any) => {
    if (!firstByContract.has(p.contract_id)) {
      firstByContract.set(p.contract_id, Number(p.amount_paid || 0));
    }
  });

  let total_dp = 0;
  firstByContract.forEach((v) => { total_dp += v; });
  return { total_dp, contract_count: firstByContract.size };
};

export const useDpTotalMonthly = (month: Date = new Date()) => {
  const start = format(startOfMonth(month), 'yyyy-MM-dd');
  const end = format(endOfMonth(month), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['dp_total_monthly', start, end],
    queryFn: () => fetchDpTotal(start, end),
  });
};

export const useDpTotalYearly = (year: Date = new Date()) => {
  const start = format(startOfYear(year), 'yyyy-MM-dd');
  const end = format(endOfYear(year), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['dp_total_yearly', start, end],
    queryFn: () => fetchDpTotal(start, end),
  });
};