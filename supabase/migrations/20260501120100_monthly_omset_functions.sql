-- Create function to handle monthly omset and commission reset (called on 1st day of month)
-- This function resets monthly_omset and monthly_commission for all agents to 0
CREATE OR REPLACE FUNCTION public.reset_monthly_omset_commission()
RETURNS TABLE (agent_id UUID, agent_name TEXT, reset_date TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE;
BEGIN
  v_now := NOW();
  
  -- Update all agents to reset monthly values (typically run on 1st day of month)
  UPDATE public.sales_agents
  SET 
    monthly_omset = 0,
    monthly_commission = 0,
    last_monthly_reset = v_now
  WHERE EXTRACT(DAY FROM last_monthly_reset) != 1 OR last_monthly_reset IS NULL;
  
  -- Return the reset agents for verification
  RETURN QUERY
  SELECT 
    sa.id,
    sa.name,
    v_now
  FROM public.sales_agents sa
  WHERE sa.last_monthly_reset = v_now;
END;
$$;

-- Create function to increment monthly omset for an agent when new contract is created
-- This function updates monthly_omset and calculates monthly_commission based on tiers
CREATE OR REPLACE FUNCTION public.update_monthly_omset_on_contract()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_omset_amount NUMERIC;
  v_agent_id UUID;
  v_new_monthly_omset NUMERIC;
  v_commission_pct NUMERIC;
  v_commission_amount NUMERIC;
BEGIN
  -- Only process if sales_agent_id is provided and contract is not being returned
  IF NEW.sales_agent_id IS NULL OR NEW.status = 'returned' THEN
    RETURN NEW;
  END IF;
  
  v_agent_id := NEW.sales_agent_id;
  v_omset_amount := COALESCE(NEW.total_loan_amount, 0);
  
  -- Check if agent needs monthly reset (if last_monthly_reset is not this month)
  IF (SELECT EXTRACT(MONTH FROM last_monthly_reset) != EXTRACT(MONTH FROM NOW()) 
      OR last_monthly_reset IS NULL
      FROM public.sales_agents WHERE id = v_agent_id) THEN
    UPDATE public.sales_agents
    SET 
      monthly_omset = 0,
      monthly_commission = 0,
      last_monthly_reset = NOW()
    WHERE id = v_agent_id;
  END IF;
  
  -- Get the updated monthly omset
  v_new_monthly_omset := COALESCE((SELECT monthly_omset FROM public.sales_agents WHERE id = v_agent_id), 0) + v_omset_amount;
  
  -- Calculate commission based on tiered system from commission_tiers
  -- Find the applicable tier for this new monthly omset
  SELECT COALESCE(ct.percentage, 0) INTO v_commission_pct
  FROM public.commission_tiers ct
  WHERE ct.min_amount <= v_new_monthly_omset
  AND (ct.max_amount IS NULL OR ct.max_amount >= v_new_monthly_omset)
  LIMIT 1;
  
  -- If no tier found, default to 0 (should not happen with proper commission_tiers setup)
  IF v_commission_pct IS NULL THEN
    v_commission_pct := 0;
  END IF;
  
  -- Calculate commission amount (percentage of monthly omset)
  v_commission_amount := (v_new_monthly_omset * v_commission_pct) / 100;
  
  -- Update the sales agent's monthly values
  UPDATE public.sales_agents
  SET 
    monthly_omset = v_new_monthly_omset,
    monthly_commission = v_commission_amount
  WHERE id = v_agent_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after a credit contract is created (start_date inserted)
DROP TRIGGER IF EXISTS trigger_update_monthly_omset_on_contract ON public.credit_contracts;
CREATE TRIGGER trigger_update_monthly_omset_on_contract
  AFTER INSERT ON public.credit_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_monthly_omset_on_contract();

-- Optional: Also handle contract status updates (e.g., if a contract is marked as returned, reduce monthly omset)
-- This can be enhanced later if needed
