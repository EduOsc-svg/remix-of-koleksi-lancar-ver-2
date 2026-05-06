import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Menghitung jumlah pelanggan UNIK (baru vs lama) per sales agent.
 *
 * Acuan grouping pelanggan:
 *   - Utama: no HP (dinormalisasi: hilangkan non-digit, prefix 62 → 0)
 *   - Fallback: nama pelanggan (lowercase, trim) jika HP kosong
 *
 * Definisi:
 *   - Lama = pelanggan yang punya ≥2 kontrak (dilihat dari SELURUH histori, lintas agen)
 *   - Baru = pelanggan yang hanya punya 1 kontrak total
 *
 * Filter periode (opsional):
 *   Jika `startDate`/`endDate` diberikan (format yyyy-MM-dd), maka per-agen hanya
 *   menghitung pelanggan yang punya kontrak dengan agen tersebut DI DALAM periode itu.
 *   Klasifikasi Baru/Lama tetap mengacu ke total kontrak lifetime pelanggan (lintas agen).
 */

const normalizePhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  if (digits.startsWith('0')) return digits;
  return digits;
};

const normalizeName = (name: string | null | undefined): string => {
  if (!name) return '';
  return String(name).trim().toLowerCase().replace(/\s+/g, ' ');
};

export interface AgentCustomerCounts {
  baru: number;
  lama: number;
}

export const useAgentCustomerCounts = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: ['agent_customer_counts', startDate || 'all', endDate || 'all'],
    queryFn: async () => {
      // Ambil SEMUA kontrak untuk lifetime classification…
      const { data: allContracts, error: allErr } = await supabase
        .from('credit_contracts')
        .select('sales_agent_id, customer_id, start_date, customers(name, phone)');
      if (allErr) throw allErr;

      // 1) Hitung jumlah kontrak global per "customer key" (lifetime, lintas agen)
      const contractCountByKey = new Map<string, number>();
      const keyByCustomerId = new Map<string, string>();

      (allContracts || []).forEach((row: any) => {
        const phoneKey = normalizePhone(row.customers?.phone);
        const nameKey = normalizeName(row.customers?.name);
        const key = phoneKey ? `p:${phoneKey}` : nameKey ? `n:${nameKey}` : null;
        if (!key) return;
        contractCountByKey.set(key, (contractCountByKey.get(key) || 0) + 1);
        if (row.customer_id) keyByCustomerId.set(row.customer_id, key);
      });

      // 2) Tentukan kontrak yang dipakai untuk per-agen counting
      //    (filter periode jika ada)
      const inPeriod = (startDate || endDate)
        ? (allContracts || []).filter((row: any) => {
            if (!row.start_date) return false;
            const d = String(row.start_date).slice(0, 10);
            if (startDate && d < startDate) return false;
            if (endDate && d > endDate) return false;
            return true;
          })
        : (allContracts || []);

      // 3) Per agen: kumpulkan pelanggan UNIK dalam periode, klasifikasi pakai lifetime
      const perAgent = new Map<string, { baru: Set<string>; lama: Set<string> }>();

      inPeriod.forEach((row: any) => {
        const agentId = row.sales_agent_id;
        if (!agentId || !row.customer_id) return;
        const key = keyByCustomerId.get(row.customer_id);
        if (!key) return;

        const totalContracts = contractCountByKey.get(key) || 1;
        const bucket = perAgent.get(agentId) || { baru: new Set<string>(), lama: new Set<string>() };
        if (totalContracts >= 2) bucket.lama.add(key);
        else bucket.baru.add(key);
        perAgent.set(agentId, bucket);
      });

      const result = new Map<string, AgentCustomerCounts>();
      perAgent.forEach((v, k) => {
        result.set(k, { baru: v.baru.size, lama: v.lama.size });
      });
      return result;
    },
  });
};
