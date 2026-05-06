-- Add columns for tracking monthly omset and commission (reset every 1st day of month)
ALTER TABLE public.sales_agents 
ADD COLUMN monthly_omset NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN monthly_commission NUMERIC NOT NULL DEFAULT 0,
ADD COLUMN last_monthly_reset TIMESTAMP WITH TIME ZONE;

-- Comment for clarity
COMMENT ON COLUMN public.sales_agents.monthly_omset IS 'Monthly cumulative omset from contracts created in current month, resets on 1st day';
COMMENT ON COLUMN public.sales_agents.monthly_commission IS 'Monthly cumulative commission calculated from monthly_omset, resets on 1st day';
COMMENT ON COLUMN public.sales_agents.last_monthly_reset IS 'Timestamp of last monthly reset (1st day of month)';

-- Create index for monthly tracking
CREATE INDEX idx_sales_agents_monthly ON public.sales_agents (monthly_omset, monthly_commission);
