import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

/**
 * Total DP = Penjumlahan kolom `dp` dari setiap kontrak yang
 * start_date-nya jatuh dalam periode (bulan / tahun). Kontrak status='returned' diabaikan.
 */
const fetchDpTotal = async (start: string, end: string): Promise<{ total_dp: number; contract_count: number }> => {
  const { data: contracts, error: cErr } = await supabase
    .from('credit_contracts')
    .select('id, dp')
    .neq('status', 'returned')
    .gte('start_date', start)
    .lte('start_date', end);
  if (cErr) throw cErr;

  let total_dp = 0;
  let contract_count = 0;
  (contracts || []).forEach((c: any) => {
    const dp = Number(c.dp || 0);
    if (dp > 0) {
      total_dp += dp;
      contract_count += 1;
    }
  });
  return { total_dp, contract_count };
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