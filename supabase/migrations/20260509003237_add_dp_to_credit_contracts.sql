-- Add DP (Down Payment) column to credit_contracts
ALTER TABLE public.credit_contracts
  ADD COLUMN IF NOT EXISTS dp NUMERIC NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.credit_contracts.dp IS 'Down Payment dari pelanggan saat kontrak dibuat (default 0)';
