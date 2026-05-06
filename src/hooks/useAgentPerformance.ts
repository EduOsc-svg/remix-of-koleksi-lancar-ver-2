import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateTieredCommission, CommissionTier } from './useCommissionTiers';
import { sumPaymentsByContract } from '@/lib/cashBasisCalc';

export interface AgentPerformanceData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_omset: number;      // CONTRACT BASIS — full nilai kontrak
  total_modal: number;      // CONTRACT BASIS — full nilai modal
  total_contracts: number;
  total_commission: number;
  total_to_collect: number; // outstanding (kupon belum dibayar)
  total_collected: number;  // uang masuk aktual
  profit: number;
  profit_margin: number;
}

export interface AgentContractHistory {
  contract_ref: string;
  customer_name: string;
  customer_code: string | null;
  product_type: string | null;
  modal: number;            // FULL (contract basis)
  omset: number;            // FULL (contract basis)
  profit: number;
  tenor_days: number;
  start_date: string;
  status: string;
  customer_created_at?: string | null;
  is_new_customer?: boolean;
  is_new_contract?: boolean;
}

/**
 * Performa agen LIFETIME — CONTRACT BASIS.
 * Omset/Modal/Profit diakui penuh saat kontrak dibuat (tidak menunggu pembayaran).
 * Komisi dihitung dari total nilai kontrak penuh × tier yang berlaku.
 * total_collected & total_to_collect tetap dari realisasi pembayaran/kupon.
 */
export const useAgentPerformance = () => {
  return useQuery({
    queryKey: ['agent_performance_contract'],
    queryFn: async () => {
      const [
        { data: agents, error: agentsError },
        { data: contracts, error: contractsError },
        { data: unpaidCoupons, error: couponsError },
        { data: payments, error: paymentsError },
        { data: tiersData },
      ] = await Promise.all([
        supabase.from('sales_agents').select('id, name, agent_code').order('name'),
        supabase.from('credit_contracts').select('id, omset, total_loan_amount, sales_agent_id, status').neq('status', 'returned'),
        supabase
          .from('installment_coupons')
          .select('amount, contract_id, credit_contracts!inner(sales_agent_id, status)')
          .eq('status', 'unpaid')
          .neq('credit_contracts.status', 'returned'),
        supabase.from('payment_logs').select('amount_paid, contract_id'),
        supabase.from('commission_tiers').select('*').order('min_amount', { ascending: true }),
      ]);

      if (agentsError) throw agentsError;
      if (contractsError) throw contractsError;
      if (couponsError) throw couponsError;
      if (paymentsError) throw paymentsError;

      const tiers: CommissionTier[] = (tiersData || []) as CommissionTier[];
      const paidByContract = sumPaymentsByContract(payments || []);

      const agentMap = new Map<string, {
        total_omset: number;
        total_modal: number;
        total_collected: number;
        total_to_collect: number;
        contract_ids: Set<string>;
      }>();

      // Akumulasi per agen — full contract value
      (contracts || []).forEach((c: any) => {
        const agentId = c.sales_agent_id;
        if (!agentId) return;
        const existing = agentMap.get(agentId) || {
          total_omset: 0, total_modal: 0, total_collected: 0, total_to_collect: 0,
          contract_ids: new Set<string>(),
        };
        existing.total_omset += Number(c.total_loan_amount || 0);
        existing.total_modal += Number(c.omset || 0);
        existing.total_collected += paidByContract.get(c.id) || 0;
        existing.contract_ids.add(c.id);
        agentMap.set(agentId, existing);
      });

      (unpaidCoupons || []).forEach((coupon: any) => {
        const agentId = coupon.credit_contracts?.sales_agent_id;
        if (!agentId) return;
        const existing = agentMap.get(agentId);
        if (existing) existing.total_to_collect += Number(coupon.amount || 0);
      });

      const result: AgentPerformanceData[] = (agents || []).map((agent) => {
        const data = agentMap.get(agent.id);
        const total_omset = data?.total_omset || 0;
        const total_modal = data?.total_modal || 0;
        const commissionPct = total_omset > 0 ? calculateTieredCommission(total_omset, tiers) : 0;
        const totalCommission = (total_omset * commissionPct) / 100;
        const profit = total_omset - total_modal;
        // Margin = markup atas modal: (omset - modal) / modal × 100
        const profitMargin = total_modal > 0 ? (profit / total_modal) * 100 : 0;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_omset,
          total_modal,
          total_contracts: data?.contract_ids.size || 0,
          total_commission: totalCommission,
          total_to_collect: data?.total_to_collect || 0,
          total_collected: data?.total_collected || 0,
          profit,
          profit_margin: profitMargin,
        };
      });

      return result.sort((a, b) => b.profit - a.profit);
    },
  });
};

export const useAgentContractHistory = (agentId: string | null) => {
  return useQuery({
    queryKey: ['agent_contract_history_contract', agentId],
    queryFn: async () => {
      if (!agentId) return [];

      const { data: contracts, error } = await supabase
        .from('credit_contracts')
        .select(`id, contract_ref, product_type, omset, total_loan_amount, tenor_days, start_date, status, sales_agent_id, customers(name, created_at)`)
        .eq('sales_agent_id', agentId)
        .order('start_date', { ascending: false });
      if (error) throw error;

      return (contracts || []).map((contract: any) => {
        const modalFull = Number(contract.omset || 0);
        const omsetFull = Number(contract.total_loan_amount || 0);
        const customerCreatedAt = contract.customers?.created_at || null;
        const startDate = contract.start_date ? new Date(contract.start_date) : null;
        const now = new Date();
        const daysSinceContract = startDate ? Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
        const daysSinceCustomer = customerCreatedAt ? Math.floor((now.getTime() - new Date(customerCreatedAt).getTime()) / (1000 * 60 * 60 * 24)) : null;
        const isNewContract = daysSinceContract !== null ? (daysSinceContract <= 7) : false;
        const isNewCustomer = daysSinceCustomer !== null ? (daysSinceCustomer <= 7) : false;
        return {
          contract_ref: contract.contract_ref,
          customer_name: contract.customers?.name || '-',
          customer_code: null,
          product_type: contract.product_type,
          modal: modalFull,
          omset: omsetFull,
          profit: omsetFull - modalFull,
          customer_created_at: customerCreatedAt,
          is_new_customer: isNewCustomer,
          is_new_contract: isNewContract,
          tenor_days: contract.tenor_days,
          start_date: contract.start_date,
          status: contract.status,
        };
      }) as AgentContractHistory[];
    },
    enabled: !!agentId,
  });
};
