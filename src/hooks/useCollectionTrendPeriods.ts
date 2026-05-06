import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type TrendPeriod = 'daily' | 'monthly' | 'yearly';

export interface TrendDataPoint {
  label: string;
  date: string;
  amount: number;        // penagihan aktual (cash)
  contractAmount: number; // omset kontrak baru (accrual)
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

// Daily trend
export const useDailyCollectionTrend = (days: number = 30) => {
  return useQuery({
    queryKey: ['collection_trend_daily_v2', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const [{ data: payments, error: pErr }, { data: contracts, error: cErr }] = await Promise.all([
        supabase
          .from('payment_logs')
          .select('payment_date, amount_paid')
          .gte('payment_date', startDateStr)
          .order('payment_date', { ascending: true }),
        supabase
          .from('credit_contracts')
          .select('start_date, total_loan_amount')
          .gte('start_date', startDateStr)
          .order('start_date', { ascending: true }),
      ]);

      if (pErr) throw pErr;
      if (cErr) throw cErr;

      const paidByDate = (payments || []).reduce<Record<string, number>>((acc, p) => {
        acc[p.payment_date] = (acc[p.payment_date] || 0) + Number(p.amount_paid);
        return acc;
      }, {});

      const contractByDate = (contracts || []).reduce<Record<string, number>>((acc, c) => {
        if (!c.start_date) return acc;
        acc[c.start_date] = (acc[c.start_date] || 0) + Number(c.total_loan_amount || 0);
        return acc;
      }, {});

      const result: TrendDataPoint[] = [];
      const currentDate = new Date(startDateStr);
      const today = new Date();

      while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        result.push({
          label: `${currentDate.getDate()}/${currentDate.getMonth() + 1}`,
          date: dateStr,
          amount: paidByDate[dateStr] || 0,
          contractAmount: contractByDate[dateStr] || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    },
  });
};

// Monthly trend
export const useMonthlyCollectionTrend = (months: number = 12) => {
  return useQuery({
    queryKey: ['collection_trend_monthly_v2', months],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);
      const startDateStr = startDate.toISOString().split('T')[0];

      const [{ data: payments, error: pErr }, { data: contracts, error: cErr }] = await Promise.all([
        supabase
          .from('payment_logs')
          .select('payment_date, amount_paid')
          .gte('payment_date', startDateStr)
          .order('payment_date', { ascending: true }),
        supabase
          .from('credit_contracts')
          .select('start_date, total_loan_amount')
          .gte('start_date', startDateStr)
          .order('start_date', { ascending: true }),
      ]);

      if (pErr) throw pErr;
      if (cErr) throw cErr;

      const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const paidByMonth = (payments || []).reduce<Record<string, number>>((acc, p) => {
        const k = monthKey(new Date(p.payment_date));
        acc[k] = (acc[k] || 0) + Number(p.amount_paid);
        return acc;
      }, {});

      const contractByMonth = (contracts || []).reduce<Record<string, number>>((acc, c) => {
        if (!c.start_date) return acc;
        const k = monthKey(new Date(c.start_date));
        acc[k] = (acc[k] || 0) + Number(c.total_loan_amount || 0);
        return acc;
      }, {});

      const result: TrendDataPoint[] = [];
      const currentDate = new Date(startDate);
      const today = new Date();

      while (currentDate <= today) {
        const k = monthKey(currentDate);
        result.push({
          label: `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear().toString().slice(-2)}`,
          date: k,
          amount: paidByMonth[k] || 0,
          contractAmount: contractByMonth[k] || 0,
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return result;
    },
  });
};

// Yearly trend
export const useYearlyCollectionTrend = (years: number = 5) => {
  return useQuery({
    queryKey: ['collection_trend_yearly_v2', years],
    queryFn: async () => {
      const startYear = new Date().getFullYear() - years + 1;
      const startDateStr = `${startYear}-01-01`;

      const [{ data: payments, error: pErr }, { data: contracts, error: cErr }] = await Promise.all([
        supabase
          .from('payment_logs')
          .select('payment_date, amount_paid')
          .gte('payment_date', startDateStr)
          .order('payment_date', { ascending: true }),
        supabase
          .from('credit_contracts')
          .select('start_date, total_loan_amount')
          .gte('start_date', startDateStr)
          .order('start_date', { ascending: true }),
      ]);

      if (pErr) throw pErr;
      if (cErr) throw cErr;

      const paidByYear = (payments || []).reduce<Record<string, number>>((acc, p) => {
        const y = new Date(p.payment_date).getFullYear().toString();
        acc[y] = (acc[y] || 0) + Number(p.amount_paid);
        return acc;
      }, {});

      const contractByYear = (contracts || []).reduce<Record<string, number>>((acc, c) => {
        if (!c.start_date) return acc;
        const y = new Date(c.start_date).getFullYear().toString();
        acc[y] = (acc[y] || 0) + Number(c.total_loan_amount || 0);
        return acc;
      }, {});

      const result: TrendDataPoint[] = [];
      const currentYear = new Date().getFullYear();

      for (let year = startYear; year <= currentYear; year++) {
        const yearStr = year.toString();
        result.push({
          label: yearStr,
          date: yearStr,
          amount: paidByYear[yearStr] || 0,
          contractAmount: contractByYear[yearStr] || 0,
        });
      }

      return result;
    },
  });
};
