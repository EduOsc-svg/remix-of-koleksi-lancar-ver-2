import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CommissionTier } from './useCommissionTiers';
import { useLogActivity } from './useActivityLog';

// Create a new commission tier
export const useCreateCommissionTier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tier: Omit<CommissionTier, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('commission_tiers')
        .insert(tier)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commission_tiers'] });
    },
  });
};

// Update an existing commission tier
export const useUpdateCommissionTier = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async ({ id, _note, ...tier }: Partial<CommissionTier> & { id: string; _note?: string }) => {
      const { data, error } = await supabase
        .from('commission_tiers')
        .update(tier)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { data, _note };
    },
    onSuccess: ({ data, _note }) => {
      queryClient.invalidateQueries({ queryKey: ['commission_tiers'] });
      logActivity.mutate({
        action: 'UPDATE',
        entity_type: 'commission_tier',
        entity_id: data.id,
        description: `Updated commission tier`,
        details: _note ? { note: _note } : null,
      });
    },
  });
};

// Delete a commission tier
export const useDeleteCommissionTier = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();

  return useMutation({
    mutationFn: async ({ id, _note }: { id: string; _note?: string }) => {
      const { error } = await supabase
        .from('commission_tiers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, _note };
    },
    onSuccess: ({ id, _note }) => {
      queryClient.invalidateQueries({ queryKey: ['commission_tiers'] });
      logActivity.mutate({
        action: 'DELETE',
        entity_type: 'commission_tier',
        entity_id: id,
        description: `Deleted commission tier`,
        details: _note ? { note: _note } : null,
      });
    },
  });
};
