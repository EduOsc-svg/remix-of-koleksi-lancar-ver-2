-- Tambahkan kolom DP (Down Payment) pada kontrak kredit.
-- DP diisi pada form kontrak; modal efektif (omset) tetap = modal - dp.
ALTER TABLE public.credit_contracts
  ADD COLUMN IF NOT EXISTS dp numeric NOT NULL DEFAULT 0;
