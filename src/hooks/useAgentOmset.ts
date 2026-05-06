import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateTieredCommission, CommissionTier } from './useCommissionTiers';

export interface AgentOmsetData {
  agent_id: string;
  agent_name: string;
  agent_code: string;
  commission_percentage: number;
  total_omset: number;      // CONTRACT BASIS — full nilai kontrak
  total_modal: number;      // CONTRACT BASIS — full modal
  total_contracts: number;
  // Booked totals (legacy compat — sama dengan total_omset/modal sekarang)
  booked_total_omset?: number;
  booked_total_modal?: number;
  booked_contracts_count?: number;
  profit: number;
  total_commission: number;
}

/**
 * Lifetime omset/modal/profit per agen — CONTRACT BASIS (accrual).
 * Omset/Modal diakui penuh saat kontrak dibuat.
 * Komisi: tier per total omset agen (full nilai kontrak).
 */
export const useAgentOmset = () => {
  return useQuery({
    queryKey: ['agent_omset_contract'],
    queryFn: async () => {
      const [
        { data: agents, error: agentsError },
        { data: contracts, error: contractsError },
        { data: tiersData },
      ] = await Promise.all([
        supabase.from('sales_agents').select('id, name, agent_code').order('name'),
        supabase.from('credit_contracts').select('id, omset, total_loan_amount, sales_agent_id, status').neq('status', 'returned'),
        supabase.from('commission_tiers').select('*').order('min_amount', { ascending: true }),
      ]);

      if (agentsError) throw agentsError;
      if (contractsError) throw contractsError;

      const tiers: CommissionTier[] = (tiersData || []) as CommissionTier[];

      const agentMap = new Map<string, { total_omset: number; total_modal: number; contract_ids: Set<string> }>();

      (contracts || []).forEach((c: any) => {
        const agentId = c.sales_agent_id;
        if (!agentId) return;
        const existing = agentMap.get(agentId) || { total_omset: 0, total_modal: 0, contract_ids: new Set<string>() };
        existing.total_omset += Number(c.total_loan_amount || 0);
        existing.total_modal += Number(c.omset || 0);
        existing.contract_ids.add(c.id);
        agentMap.set(agentId, existing);
      });

      const result: AgentOmsetData[] = (agents || []).map((agent) => {
        const data = agentMap.get(agent.id);
        const total_omset = data?.total_omset || 0;
        const total_modal = data?.total_modal || 0;
        const total_contracts = data?.contract_ids.size || 0;
        const commissionPct = total_omset > 0 ? calculateTieredCommission(total_omset, tiers) : 0;
        const profit = total_omset - total_modal;
        const totalCommission = (total_omset * commissionPct) / 100;

        return {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_code: agent.agent_code,
          commission_percentage: commissionPct,
          total_omset,
          total_modal,
          total_contracts,
          booked_total_omset: total_omset,
          booked_total_modal: total_modal,
          booked_contracts_count: total_contracts,
          profit,
          total_commission: totalCommission,
        };
      });

      return result;
    },
  });
};
