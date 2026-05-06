-- Add is_active column to mark working/non-working sales agents and collectors
ALTER TABLE public.sales_agents
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.collectors
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_sales_agents_is_active ON public.sales_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_collectors_is_active ON public.collectors(is_active);
