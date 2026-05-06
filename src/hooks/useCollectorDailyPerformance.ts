import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface CollectorDailyRow {
  collector_id: string;
  collector_name: string;
  collector_code: string;
  coupons_handed_over: number;   // jumlah kupon yang dipegang utk hari itu
  coupons_collected: number;     // jumlah kupon ter-bayar oleh kolektor ini di tgl tsb
  amount_handed: number;         // total Rp yang seharusnya tertagih (target)
  amount_collected: number;      // total Rp tertagih
  unique_contracts: number;      // jumlah kontrak unik yang ditagih
  success_rate: number;          // coupons_collected / coupons_handed_over * 100
}

export interface CollectorDailyPerformance {
  date: string;
  rows: CollectorDailyRow[];
  total_amount: number;
  total_handed_amount: number;
  total_coupons_collected: number;
  total_coupons_handed: number;
  avg_success_rate: number;
}

/**
 * Performa harian kolektor untuk acuan bonus.
 */
export const useCollectorDailyPerformance = (date: string) => {
  return useQuery({
    queryKey: ['collector_daily_performance', date],
    queryFn: async (): Promise<CollectorDailyPerformance> => {
      const [
        { data: collectors, error: cErr },
        { data: payments, error: pErr },
        { data: handovers, error: hErr },
      ] = await Promise.all([
        supabase.from('collectors').select('id, name, collector_code').order('name'),
        supabase
          .from('payment_logs')
          .select('collector_id, amount_paid, contract_id')
          .eq('payment_date', date),
        supabase
          .from('coupon_handovers')
          .select('collector_id, coupon_count, contract_id, credit_contracts(daily_installment_amount)')
          .eq('handover_date', date),
      ]);

      if (cErr) throw cErr;
      if (pErr) throw pErr;
      if (hErr) throw hErr;

      const handedMap = new Map<string, { coupons: number; amount: number }>();
      (handovers || []).forEach((h: any) => {
        if (!h.collector_id) return;
        const ex = handedMap.get(h.collector_id) || { coupons: 0, amount: 0 };
        const count = Number(h.coupon_count || 0);
        const dailyAmt = Number(h.credit_contracts?.daily_installment_amount || 0);
        ex.coupons += count;
        ex.amount += count * dailyAmt;
        handedMap.set(h.collector_id, ex);
      });

      const payMap = new Map<string, { amount: number; coupons: number; contracts: Set<string> }>();
      (payments || []).forEach((p: any) => {
        if (!p.collector_id) return;
        const ex = payMap.get(p.collector_id) || { amount: 0, coupons: 0, contracts: new Set<string>() };
        ex.amount += Number(p.amount_paid || 0);
        ex.coupons += 1;
        if (p.contract_id) ex.contracts.add(p.contract_id);
        payMap.set(p.collector_id, ex);
      });

      const rows: CollectorDailyRow[] = (collectors || [])
        .map((c: any) => {
          const pay = payMap.get(c.id);
          const handed = handedMap.get(c.id) || { coupons: 0, amount: 0 };
          const collected = pay?.coupons || 0;
          const amount = pay?.amount || 0;
          const success = handed.coupons > 0 ? (collected / handed.coupons) * 100 : 0;
          return {
            collector_id: c.id,
            collector_name: c.name,
            collector_code: c.collector_code,
            coupons_handed_over: handed.coupons,
            coupons_collected: collected,
            amount_handed: handed.amount,
            amount_collected: amount,
            unique_contracts: pay?.contracts.size || 0,
            success_rate: success,
          };
        })
        .filter((r) => r.coupons_handed_over > 0 || r.coupons_collected > 0)
        .sort((a, b) => b.amount_collected - a.amount_collected);

      const total_amount = rows.reduce((s, r) => s + r.amount_collected, 0);
      const total_handed_amount = rows.reduce((s, r) => s + r.amount_handed, 0);
      const total_coupons_collected = rows.reduce((s, r) => s + r.coupons_collected, 0);
      const total_coupons_handed = rows.reduce((s, r) => s + r.coupons_handed_over, 0);
      const avg_success_rate = total_coupons_handed > 0 ? (total_coupons_collected / total_coupons_handed) * 100 : 0;

      return { date, rows, total_amount, total_handed_amount, total_coupons_collected, total_coupons_handed, avg_success_rate };
    },
  });
};

/**
 * Rekap bulanan kolektor (untuk perhitungan bonus bulanan).
 * Reset tiap tgl 1.
 */
export const useCollectorMonthlyPerformance = (month: Date = new Date()) => {
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['collector_monthly_performance', monthStart, monthEnd],
    queryFn: async () => {
      const [
        { data: collectors, error: cErr },
        { data: payments, error: pErr },
        { data: handovers, error: hErr },
      ] = await Promise.all([
        supabase.from('collectors').select('id, name, collector_code').order('name'),
        supabase
          .from('payment_logs')
          .select('collector_id, amount_paid, contract_id, payment_date')
          .gte('payment_date', monthStart)
          .lte('payment_date', monthEnd),
        supabase
          .from('coupon_handovers')
          .select('collector_id, coupon_count, handover_date, contract_id, credit_contracts(daily_installment_amount)')
          .gte('handover_date', monthStart)
          .lte('handover_date', monthEnd),
      ]);
      if (cErr) throw cErr;
      if (pErr) throw pErr;
      if (hErr) throw hErr;

      const handedMap = new Map<string, { coupons: number; amount: number }>();
      (handovers || []).forEach((h: any) => {
        if (!h.collector_id) return;
        const ex = handedMap.get(h.collector_id) || { coupons: 0, amount: 0 };
        const count = Number(h.coupon_count || 0);
        const dailyAmt = Number(h.credit_contracts?.daily_installment_amount || 0);
        ex.coupons += count;
        ex.amount += count * dailyAmt;
        handedMap.set(h.collector_id, ex);
      });

      const payMap = new Map<string, { amount: number; coupons: number; contracts: Set<string>; days: Set<string> }>();
      (payments || []).forEach((p: any) => {
        if (!p.collector_id) return;
        const ex = payMap.get(p.collector_id) || { amount: 0, coupons: 0, contracts: new Set<string>(), days: new Set<string>() };
        ex.amount += Number(p.amount_paid || 0);
        ex.coupons += 1;
        if (p.contract_id) ex.contracts.add(p.contract_id);
        if (p.payment_date) ex.days.add(p.payment_date);
        payMap.set(p.collector_id, ex);
      });

      const rows = (collectors || [])
        .map((c: any) => {
          const pay = payMap.get(c.id);
          const handed = handedMap.get(c.id) || { coupons: 0, amount: 0 };
          const collected = pay?.coupons || 0;
          const amount = pay?.amount || 0;
          const success = handed.coupons > 0 ? (collected / handed.coupons) * 100 : 0;
          return {
            collector_id: c.id,
            collector_name: c.name,
            collector_code: c.collector_code,
            coupons_handed_over: handed.coupons,
            coupons_collected: collected,
            amount_handed: handed.amount,
            amount_collected: amount,
            unique_contracts: pay?.contracts.size || 0,
            active_days: pay?.days.size || 0,
            success_rate: success,
          };
        })
        .filter((r) => r.coupons_handed_over > 0 || r.coupons_collected > 0)
        .sort((a, b) => b.amount_collected - a.amount_collected);

      const total_amount = rows.reduce((s, r) => s + r.amount_collected, 0);
      const total_handed_amount = rows.reduce((s, r) => s + r.amount_handed, 0);
      const total_coupons_collected = rows.reduce((s, r) => s + r.coupons_collected, 0);
      const total_coupons_handed = rows.reduce((s, r) => s + r.coupons_handed_over, 0);
      const avg_success_rate = total_coupons_handed > 0 ? (total_coupons_collected / total_coupons_handed) * 100 : 0;

      return { rows, total_amount, total_handed_amount, total_coupons_collected, total_coupons_handed, avg_success_rate };
    },
  });
};
