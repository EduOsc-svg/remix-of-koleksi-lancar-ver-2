-- =========================================
-- DELETE ALL DATA SCRIPT
-- Selaras dengan schema Supabase saat ini
-- (tidak ada tabel routes / customer_code)
-- =========================================

-- Order penting karena foreign key constraint
DELETE FROM public.activity_logs;
DELETE FROM public.commission_payments;
DELETE FROM public.coupon_handovers;
DELETE FROM public.payment_logs;
DELETE FROM public.installment_coupons;
DELETE FROM public.credit_contracts;
DELETE FROM public.customers;

-- Master/reference data dipertahankan:
-- sales_agents, collectors, holidays, operational_expenses,
-- commission_tiers, user_roles

-- Verifikasi hasil delete
SELECT 'activity_logs' as table_name, COUNT(*) as remaining FROM public.activity_logs
UNION ALL SELECT 'commission_payments', COUNT(*) FROM public.commission_payments
UNION ALL SELECT 'coupon_handovers', COUNT(*) FROM public.coupon_handovers
UNION ALL SELECT 'payment_logs', COUNT(*) FROM public.payment_logs
UNION ALL SELECT 'installment_coupons', COUNT(*) FROM public.installment_coupons
UNION ALL SELECT 'credit_contracts', COUNT(*) FROM public.credit_contracts
UNION ALL SELECT 'customers', COUNT(*) FROM public.customers;

SELECT 'Semua data transaksional berhasil dihapus' as status;
