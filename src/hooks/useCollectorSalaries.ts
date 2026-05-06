import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'sonner';

/**
 * Gaji kolektor disimpan sebagai operational_expenses dengan:
 *   - category = "Gaji Kolektor"
 *   - notes berisi tag "[collector:<uuid>]" agar bisa di-link ke collector
 *   - expense_date = tanggal 1 di bulan terkait (kunci per-bulan)
 *
 * Dengan begitu gaji otomatis terhitung dalam keuntungan bersih dashboard
 * (yang sudah mengurangi totalExpenses dari operational_expenses).
 *
 * "Reset" per bulan: tiap bulan baru = baris baru. Bulan lama tetap tersimpan
 * untuk audit & rekap tahunan.
 */

const CATEGORY = 'Gaji Kolektor';
const tagFor = (collectorId: string) => `[collector:${collectorId}]`;
const monthKey = (month: Date) => format(startOfMonth(month), 'yyyy-MM-dd');

export interface CollectorSalaryRow {
  collector_id: string;
  amount: number;
  expense_id: string | null;
  notes: string | null;
}

// Ambil gaji semua kolektor untuk bulan terpilih
export const useCollectorSalaries = (month: Date = new Date()) => {
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['collector_salaries', monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_expenses')
        .select('id, expense_date, amount, notes, category')
        .eq('category', CATEGORY)
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd);

      if (error) throw error;

      // Map collector_id -> salary row
      const map = new Map<string, CollectorSalaryRow>();
      (data || []).forEach((row: any) => {
        const match = (row.notes || '').match(/\[collector:([0-9a-fA-F-]{36})\]/);
        if (!match) return;
        const collectorId = match[1];
        // Jika ada lebih dari satu untuk bulan yang sama, ambil yang terbaru / jumlahkan? — pilih jumlahkan
        const existing = map.get(collectorId);
        if (existing) {
          existing.amount += Number(row.amount || 0);
        } else {
          map.set(collectorId, {
            collector_id: collectorId,
            amount: Number(row.amount || 0),
            expense_id: row.id,
            notes: row.notes,
          });
        }
      });

      return map;
    },
  });
};

// Total gaji kolektor untuk bulan terpilih
export const useCollectorSalaryTotal = (month: Date = new Date()) => {
  const { data } = useCollectorSalaries(month);
  let total = 0;
  data?.forEach((row) => { total += row.amount; });
  return total;
};

// Total gaji kolektor untuk satu tahun terpilih
export const useCollectorSalaryTotalYearly = (year: Date = new Date()) => {
  const yearNum = year.getFullYear();
  const yearStart = `${yearNum}-01-01`;
  const yearEnd = `${yearNum}-12-31`;

  const { data } = useQuery({
    queryKey: ['collector_salaries_yearly', yearStart, yearEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_expenses')
        .select('amount')
        .eq('category', CATEGORY)
        .gte('expense_date', yearStart)
        .lte('expense_date', yearEnd);
      if (error) throw error;
      return (data || []).reduce((s, r: any) => s + Number(r.amount || 0), 0);
    },
  });

  return data ?? 0;
};

// Set/upsert gaji kolektor untuk bulan tertentu
export const useSetCollectorSalary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      collector_id: string;
      collector_name: string;
      amount: number;
      month: Date;
    }) => {
      const monthStart = monthKey(input.month);
      const monthEnd = format(endOfMonth(input.month), 'yyyy-MM-dd');
      const tag = tagFor(input.collector_id);

      // Cari existing row utk (collector, month)
      const { data: existing, error: findErr } = await supabase
        .from('operational_expenses')
        .select('id')
        .eq('category', CATEGORY)
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd)
        .like('notes', `%${tag}%`)
        .limit(1);

      if (findErr) throw findErr;

      const description = `Gaji Kolektor ${input.collector_name} - ${format(startOfMonth(input.month), 'MMM yyyy')}`;
      const notes = `${tag} Gaji bulanan kolektor`;

      if (existing && existing.length > 0) {
        // Update
        if (input.amount <= 0) {
          // Hapus jika di-set ke 0
          const { error: delErr } = await supabase
            .from('operational_expenses')
            .delete()
            .eq('id', existing[0].id);
          if (delErr) throw delErr;
          return { action: 'deleted' };
        }
        const { error: updErr } = await supabase
          .from('operational_expenses')
          .update({
            amount: input.amount,
            description,
            notes,
            expense_date: monthStart,
          })
          .eq('id', existing[0].id);
        if (updErr) throw updErr;
        return { action: 'updated' };
      } else {
        if (input.amount <= 0) return { action: 'noop' };
        // Insert baru — kunci tanggal = tanggal 1 bulan tsb
        const { error: insErr } = await supabase
          .from('operational_expenses')
          .insert({
            expense_date: monthStart,
            description,
            amount: input.amount,
            category: CATEGORY,
            notes,
          });
        if (insErr) throw insErr;
        return { action: 'created' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collector_salaries'] });
      queryClient.invalidateQueries({ queryKey: ['operational_expenses'] });
      toast.success('Gaji kolektor disimpan');
    },
    onError: (err: any) => {
      toast.error('Gagal menyimpan gaji: ' + (err.message || err));
    },
  });
};
