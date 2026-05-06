import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

/**
 * Hitung kerugian dari kontrak yang di-return / macet permanen.
 * Kerugian = Modal yang sudah dikeluarkan - Uang yang sempat tertagih (dari kontrak tsb).
 */
export interface ReturnedContractDetail {
  id: string;
  contract_ref: string;
  start_date: string;
  customer_name: string | null;
  sales_id: string | null;
  sales_name: string | null;
  sales_code: string | null;
  omset: number;
  total_omset: number;
  collected_back: number;
  loss: number;
}

export interface ReturnedLossSummary {
  total_modal_loss: number;       // total modal yang ditanam pada kontrak return
  total_omset: number;             // total nilai jual (total_loan_amount) kontrak return
  total_collected_back: number;    // total uang yg sempat tertagih dari kontrak return
  total_loss: number;              // modal - tertagih (kerugian bersih)
  returned_count: number;          // jumlah kontrak return
  contracts: ReturnedContractDetail[]; // detail per-kontrak
  by_sales: Array<{
    sales_id: string | null;
    sales_name: string;
    sales_code: string | null;
    contract_count: number;
    total_omset: number;
    total_collected: number;
    total_loss: number;
  }>;
}

const fetchReturnedLoss = async (rangeStart: string, rangeEnd: string): Promise<ReturnedLossSummary> => {
  const { data: returnedContracts, error: cErr } = await supabase
    .from('credit_contracts')
    .select('id, contract_ref, omset, total_loan_amount, start_date, status, sales_agent_id, customer_id, customers(name), sales_agents(id, name, agent_code)')
    .eq('status', 'returned')
    .gte('start_date', rangeStart)
    .lte('start_date', rangeEnd);
  if (cErr) throw cErr;

  const ids = (returnedContracts || []).map((c: any) => c.id);
  const collectedMap = new Map<string, number>();
  if (ids.length > 0) {
    const { data: payments, error: pErr } = await supabase
      .from('payment_logs')
      .select('contract_id, amount_paid')
      .in('contract_id', ids);
    if (pErr) throw pErr;
    (payments || []).forEach((p: any) => {
      collectedMap.set(p.contract_id, (collectedMap.get(p.contract_id) || 0) + Number(p.amount_paid || 0));
    });
  }

  let total_modal_loss = 0;
  let total_omset_all = 0;
  let total_collected_back = 0;
  const contracts: ReturnedContractDetail[] = [];
  const salesAgg = new Map<string, { sales_id: string | null; sales_name: string; sales_code: string | null; contract_count: number; total_omset: number; total_collected: number; total_loss: number }>();

  (returnedContracts || []).forEach((c: any) => {
    const omset = Number(c.omset || 0);
    const totalOmset = Number(c.total_loan_amount || 0);
    const collected = collectedMap.get(c.id) || 0;
    const loss = Math.max(0, omset - collected);
    total_modal_loss += omset;
    total_omset_all += totalOmset;
    total_collected_back += collected;

    const salesName = c.sales_agents?.name || '— Tanpa Sales —';
    const salesCode = c.sales_agents?.agent_code || null;
    const salesId = c.sales_agent_id || null;

    contracts.push({
      id: c.id,
      contract_ref: c.contract_ref,
      start_date: c.start_date,
      customer_name: c.customers?.name || null,
      sales_id: salesId,
      sales_name: salesName,
      sales_code: salesCode,
      omset,
      total_omset: totalOmset,
      collected_back: collected,
      loss,
    });

    const key = salesId || '__none__';
    const cur = salesAgg.get(key) || { sales_id: salesId, sales_name: salesName, sales_code: salesCode, contract_count: 0, total_omset: 0, total_collected: 0, total_loss: 0 };
    cur.contract_count += 1;
    cur.total_omset += totalOmset;
    cur.total_collected += collected;
    cur.total_loss += loss;
    salesAgg.set(key, cur);
  });

  const total_loss = Math.max(0, total_modal_loss - total_collected_back);

  return {
    total_modal_loss,
    total_omset: total_omset_all,
    total_collected_back,
    total_loss,
    returned_count: (returnedContracts || []).length,
    contracts: contracts.sort((a, b) => b.loss - a.loss),
    by_sales: Array.from(salesAgg.values()).sort((a, b) => b.total_loss - a.total_loss),
  };
};

/** Scope: kontrak return di bulan terpilih (start_date dalam bulan tsb). */
export const useReturnedLoss = (month: Date = new Date()) => {
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['returned_loss', monthStart, monthEnd],
    queryFn: () => fetchReturnedLoss(monthStart, monthEnd),
  });
};

/** Scope: kontrak return di tahun terpilih (start_date dalam tahun tsb). */
export const useReturnedLossYearly = (year: Date = new Date()) => {
  const yearStart = format(startOfYear(year), 'yyyy-MM-dd');
  const yearEnd = format(endOfYear(year), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['returned_loss_yearly', yearStart, yearEnd],
    queryFn: () => fetchReturnedLoss(yearStart, yearEnd),
  });
};
