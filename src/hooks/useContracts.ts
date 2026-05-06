import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLogActivity } from './useActivityLog';
import { saveToCache, loadFromCache } from '@/lib/queryCache';

export interface CreditContract {
  id: string;
  contract_ref: string;
  customer_id: string;
  sales_agent_id: string | null;
  collector_id: string | null;
  product_type: string | null;
  total_loan_amount: number;
  omset: number | null;
  tenor_days: number;
  daily_installment_amount: number;
  current_installment_index: number;
  status: string;
  start_date: string;
  created_at: string;
}

export interface ContractWithCustomer extends CreditContract {
  customers: {
    name: string;
    address: string | null;
    business_address: string | null;
    phone: string | null;
  } | null;
  sales_agents?: { name: string; agent_code: string } | null;
  collectors?: { name: string; collector_code: string } | null;
}

export const useContracts = (status?: string) => {
  const queryKey = ['credit_contracts', status];
  return useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from('credit_contracts')
        .select('*, customers(name, address, business_address, phone), sales_agents(name, agent_code), collectors(name, collector_code)')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      const result = data as ContractWithCustomer[];
      saveToCache(queryKey, result);
      return result;
    },
    initialData: () => loadFromCache<ContractWithCustomer[]>(queryKey),
    initialDataUpdatedAt: 0, // always refetch when online
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async (contract: Omit<CreditContract, 'id' | 'created_at' | 'current_installment_index'>) => {
      const { data, error } = await supabase
        .from('credit_contracts')
        .insert({ ...contract, current_installment_index: 0 })
        .select()
        .single();
      if (error) throw error;
      return { data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_details'] });
      
      logActivity.mutate({
        action: 'CREATE',
        entity_type: 'contract',
        entity_id: result.data.id,
        description: `Created contract ${result.data.contract_ref} with loan amount ${result.data.total_loan_amount}`,
        contract_id: result.data.id,
      });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async ({ id, _note, ...contract }: Partial<CreditContract> & { id: string; _note?: string }) => {
      const { data, error } = await supabase
        .from('credit_contracts')
        .update(contract)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data, _note };
    },
    onSuccess: ({ data, _note }) => {
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_details'] });

      logActivity.mutate({
        action: 'UPDATE',
        entity_type: 'contract',
        entity_id: data.id,
        description: `Updated contract ${data.contract_ref}`,
        contract_id: data.id,
        details: _note ? { note: _note } : null,
      });
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async ({ id, _note }: { id: string; _note?: string }) => {
      const { data: contractData } = await supabase
        .from('credit_contracts')
        .select('contract_ref')
        .eq('id', id)
        .single();

      const { error: phErr } = await supabase
        .from('payment_logs')
        .delete()
        .eq('contract_id', id);
      if (phErr) throw new Error(`Gagal hapus riwayat pembayaran: ${phErr.message}`);

      const { error: chErr } = await supabase
        .from('coupon_handovers')
        .delete()
        .eq('contract_id', id);
      if (chErr) throw new Error(`Gagal hapus riwayat serah terima kupon: ${chErr.message}`);

      const { error: icErr } = await supabase
        .from('installment_coupons')
        .delete()
        .eq('contract_id', id);
      if (icErr) throw new Error(`Gagal hapus kupon: ${icErr.message}`);

      const { error } = await supabase
        .from('credit_contracts')
        .delete()
        .eq('id', id);
      if (error) throw new Error(`Gagal hapus kontrak: ${error.message}`);
      return { id, contract_ref: contractData?.contract_ref, _note };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_details'] });
      queryClient.invalidateQueries({ queryKey: ['installment_coupons'] });
      queryClient.invalidateQueries({ queryKey: ['payment_logs'] });
      queryClient.invalidateQueries({ queryKey: ['coupon_handovers'] });
      queryClient.invalidateQueries({ queryKey: ['outstanding_coupons'] });

      logActivity.mutate({
        action: 'DELETE',
        entity_type: 'contract',
        entity_id: data.id,
        description: `Deleted contract ${data.contract_ref || data.id}`,
        details: data._note ? { note: data._note } : null,
      });
    },
  });
};

export const useInvoiceDetails = () => {
  return useQuery({
    queryKey: ['invoice_details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_details')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
