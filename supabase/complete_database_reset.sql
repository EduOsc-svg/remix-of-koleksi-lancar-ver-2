-- =========================================
-- COMPLETE DATABASE RESET AND SAMPLE DATA
-- Selaras dengan schema Supabase aktual:
--   - Tidak ada tabel "routes"
--   - customers TIDAK punya customer_code (ada nik & business_address)
--   - credit_contracts punya kolom: omset (modal), dp, total_loan_amount (omset jual)
--   - sales_agents punya use_tiered_commission
-- =========================================
-- ⚠ HATI-HATI di production!

BEGIN;

-- =========================================
-- STEP 1: HAPUS SEMUA DATA TRANSAKSIONAL
-- =========================================
DELETE FROM public.activity_logs;
DELETE FROM public.commission_payments;
DELETE FROM public.coupon_handovers;
DELETE FROM public.payment_logs;
DELETE FROM public.installment_coupons;
DELETE FROM public.credit_contracts;
DELETE FROM public.customers;
DELETE FROM public.collectors;
DELETE FROM public.sales_agents;
DELETE FROM public.holidays;

DO $$
DECLARE table_counts TEXT;
BEGIN
  SELECT string_agg(table_name || ': ' || record_count, ', ' ORDER BY table_name) INTO table_counts
  FROM (
    SELECT 'activity_logs' AS table_name, COUNT(*)::text AS record_count FROM public.activity_logs
    UNION ALL SELECT 'commission_payments', COUNT(*)::text FROM public.commission_payments
    UNION ALL SELECT 'coupon_handovers', COUNT(*)::text FROM public.coupon_handovers
    UNION ALL SELECT 'payment_logs', COUNT(*)::text FROM public.payment_logs
    UNION ALL SELECT 'installment_coupons', COUNT(*)::text FROM public.installment_coupons
    UNION ALL SELECT 'credit_contracts', COUNT(*)::text FROM public.credit_contracts
    UNION ALL SELECT 'customers', COUNT(*)::text FROM public.customers
    UNION ALL SELECT 'collectors', COUNT(*)::text FROM public.collectors
    UNION ALL SELECT 'sales_agents', COUNT(*)::text FROM public.sales_agents
    UNION ALL SELECT 'holidays', COUNT(*)::text FROM public.holidays
  ) counts;
  RAISE NOTICE 'Tables setelah delete - %', table_counts;
END $$;

COMMIT;

-- =========================================
-- STEP 2: INSERT MASTER DATA
-- =========================================
BEGIN;

-- 1. SALES AGENTS (10 records)
INSERT INTO public.sales_agents (id, agent_code, name, phone, commission_percentage, use_tiered_commission) VALUES
(gen_random_uuid(), 'S001', 'Ahmad Rizky',     '081234567890', 5.0, true),
(gen_random_uuid(), 'S002', 'Siti Nurhaliza',  '081234567891', 4.5, true),
(gen_random_uuid(), 'S003', 'Budi Santoso',    '081234567892', 5.5, true),
(gen_random_uuid(), 'S004', 'Dewi Kartika',    '081234567893', 4.0, true),
(gen_random_uuid(), 'S005', 'Eko Prasetyo',    '081234567894', 6.0, true),
(gen_random_uuid(), 'S006', 'Fitri Handayani', '081234567895', 4.5, true),
(gen_random_uuid(), 'S007', 'Gunawan Wijaya',  '081234567896', 5.0, true),
(gen_random_uuid(), 'S008', 'Hesti Purwanti',  '081234567897', 5.5, true),
(gen_random_uuid(), 'S009', 'Indra Kusuma',    '081234567898', 4.0, true),
(gen_random_uuid(), 'S010', 'Joko Susilo',     '081234567899', 6.0, true);

-- 2. COLLECTORS (5 records)
INSERT INTO public.collectors (id, collector_code, name, phone) VALUES
(gen_random_uuid(), 'K001', 'Rizky Ramadhan', '081234567801'),
(gen_random_uuid(), 'K002', 'Dwi Cahyono',    '081234567802'),
(gen_random_uuid(), 'K003', 'Teguh Prasetyo', '081234567803'),
(gen_random_uuid(), 'K004', 'Hendra Gunawan', '081234567804'),
(gen_random_uuid(), 'K005', 'Slamet Widodo',  '081234567805');

-- 3. HOLIDAYS (Sample 2026)
INSERT INTO public.holidays (id, holiday_date, description, holiday_type, day_of_week) VALUES
(gen_random_uuid(), '2026-01-01', 'Tahun Baru Masehi',     'specific_date', NULL),
(gen_random_uuid(), '2026-02-17', 'Tahun Baru Imlek',      'specific_date', NULL),
(gen_random_uuid(), '2026-03-19', 'Hari Raya Nyepi',       'specific_date', NULL),
(gen_random_uuid(), '2026-04-03', 'Wafat Isa Almasih',     'specific_date', NULL),
(gen_random_uuid(), '2026-05-01', 'Hari Buruh',            'specific_date', NULL),
(gen_random_uuid(), '2026-05-14', 'Kenaikan Isa Almasih',  'specific_date', NULL),
(gen_random_uuid(), '2026-05-21', 'Idul Fitri',            'specific_date', NULL),
(gen_random_uuid(), '2026-08-17', 'Kemerdekaan RI',        'specific_date', NULL),
(gen_random_uuid(), '2026-12-25', 'Hari Natal',            'specific_date', NULL),
(gen_random_uuid(), NULL,         'Hari Minggu (Weekend)', 'recurring_weekday', 0);

-- 4. CUSTOMERS (10 records) — TANPA customer_code
INSERT INTO public.customers (id, name, address, business_address, phone, nik) VALUES
(gen_random_uuid(), 'Ayu Lestari',      'Jl. Mawar No. 12, Karawang Timur',  'Pasar Karawang Blok A1',  '087654321001', '3201010101010001'),
(gen_random_uuid(), 'Bambang Sutrisno', 'Jl. Melati No. 25, Karawang Barat', 'Pasar Karawang Blok B2',  '087654321002', '3201010101010002'),
(gen_random_uuid(), 'Citra Dewi',       'Jl. Anggrek No. 8, Bekasi Utara',   'Pasar Bekasi Blok C3',    '087654321003', '3201010101010003'),
(gen_random_uuid(), 'Dedi Kurniawan',   'Jl. Kenanga No. 15, Bekasi Selatan','Pasar Bekasi Blok D4',    '087654321004', '3201010101010004'),
(gen_random_uuid(), 'Erna Sari',        'Jl. Dahlia No. 30, Cibitung',       'Pasar Cibitung Blok E5',  '087654321005', '3201010101010005'),
(gen_random_uuid(), 'Fajar Nugraha',    'Jl. Tulip No. 7, Cikarang',         'Pasar Cikarang Blok F6',  '087654321006', '3201010101010006'),
(gen_random_uuid(), 'Gita Purnama',     'Jl. Sakura No. 22, Tambun',         'Pasar Tambun Blok G7',    '087654321007', '3201010101010007'),
(gen_random_uuid(), 'Hendra Wijaya',    'Jl. Flamboyan No. 18, Rawa Lumbu',  'Pasar Rawa Lumbu Blok H8','087654321008', '3201010101010008'),
(gen_random_uuid(), 'Indah Permata',    'Jl. Cempaka No. 11, Teluk Pucung',  'Pasar Teluk Blok I9',     '087654321009', '3201010101010009'),
(gen_random_uuid(), 'Jaka Prasetya',    'Jl. Bougenvil No. 28, Klari',       'Pasar Klari Blok J10',    '087654321010', '3201010101010010');

-- 5. CREDIT CONTRACTS (10 records)
-- omset (db) = Modal Efektif (modal awal − dp), total_loan_amount = Omset jual
INSERT INTO public.credit_contracts (
  id, contract_ref, customer_id, sales_agent_id, collector_id,
  product_type, total_loan_amount, omset, dp,
  tenor_days, daily_installment_amount,
  current_installment_index, status, start_date
) VALUES
(gen_random_uuid(), 'A001', (SELECT id FROM customers WHERE name='Ayu Lestari' LIMIT 1),      (SELECT id FROM sales_agents WHERE agent_code='S001' LIMIT 1), (SELECT id FROM collectors WHERE collector_code='K001' LIMIT 1), 'Elektronik',   6000000, 5000000,    0, 100, 60000, 15, 'active', '2026-01-05'),
(gen_random_uuid(), 'A002', (SELECT id FROM customers WHERE name='Bambang Sutrisno' LIMIT 1), (SELECT id FROM sales_agents WHERE agent_code='S002' LIMIT 1), (SELECT id FROM collectors WHERE collector_code='K002' LIMIT 1), 'Furniture',    9600000, 7600000,  500000, 120, 80000, 25, 'active', '2026-01-15'),
(gen_random_uuid(), 'A003', (SELECT id FROM customers WHERE name='Citra Dewi' LIMIT 1),       (SELECT id FROM sales_agents WHERE agent_code='S003' LIMIT 1), (SELECT id FROM collectors WHERE collector_code='K003' LIMIT 1), 'Motor',       14400000,11400000, 1000000, 150, 96000, 30, 'active', '2026-02-01'),
(gen_random_uuid(), 'A004', (SELECT id FROM customers WHERE name='Dedi Kurniawan' LIMIT 1),   (SELECT id FROM sales_agents WHERE agent_code='S004' LIMIT 1), (SELECT id FROM collectors WHERE collector_code='K004' LIMIT 1), 'Handphone',    3600000, 3000000,    0,  60, 60000, 45, 'active', '2026-02-15'),
(gen_random_uuid(), 'A005', (SELECT id FROM customers WHERE name='Erna Sari' LIMIT 1),        (SELECT id FROM sales_agents WHERE agent_code='S005' LIMIT 1), (SELECT id FROM collectors WHERE collector_code='K005' LIMIT 1), 'Perabotan',    7200000, 5700000,  500000, 100, 72000, 20, 'active', '2026-03-01'),
(gen_random_uuid(), 'A006', (SELECT id FROM customers WHERE name='Fajar Nugraha' LIMIT 1),    (SELECT id FROM sales_agents WHERE agent_code='S006' LIMIT 1), (SELECT id FROM collectors WHERE collector_code='K001' LIMIT 1), 'Laptop',      12000000,10000000,    0, 100,120000, 10, 'active', '2026-03-10'),
(gen_random_uuid(), 'A007', (SELECT id FROM customers WHERE name='Gita Purnama' LIMIT 1),     (SELECT id FROM sales_agents WHERE agent_code='S007' LIMIT 1), (SELECT id FROM collectors WHERE collector_code='K002' LIMIT 1), 'Kulkas',       8400000, 6700000,  500000,  90, 93333, 60, 'active', '2026-03-20'),
(gen_random_uuid(), 'A008', (SELECT id FROM customers WHERE name='Hendra Wijaya' LIMIT 1),    (SELECT id FROM sales_agents WHERE agent_code='S008' LIMIT 1), (SELECT id FROM collectors WHERE collector_code='K003' LIMIT 1), 'AC',           4800000, 4000000,    0,  80, 60000, 70, 'active', '2026-04-01'),
(gen_random_uuid(), 'A009', (SELECT id FROM customers WHERE name='Indah Permata' LIMIT 1),    (SELECT id FROM sales_agents WHERE agent_code='S009' LIMIT 1), (SELECT id FROM collectors WHERE collector_code='K004' LIMIT 1), 'TV',           6600000, 5300000,  300000, 110, 60000, 35, 'active', '2026-04-15'),
(gen_random_uuid(), 'A010', (SELECT id FROM customers WHERE name='Jaka Prasetya' LIMIT 1),    (SELECT id FROM sales_agents WHERE agent_code='S010' LIMIT 1), (SELECT id FROM collectors WHERE collector_code='K005' LIMIT 1), 'Mesin Cuci',   7800000, 6500000,    0, 100, 78000,  5, 'active', '2026-05-01');

COMMIT;

-- =========================================
-- VERIFIKASI AKHIR
-- =========================================
SELECT '=== DATABASE READY ===' AS status;

SELECT 'sales_agents' AS tabel, COUNT(*)::text AS jumlah FROM public.sales_agents
UNION ALL SELECT 'collectors',         COUNT(*)::text FROM public.collectors
UNION ALL SELECT 'customers',          COUNT(*)::text FROM public.customers
UNION ALL SELECT 'holidays',           COUNT(*)::text FROM public.holidays
UNION ALL SELECT 'credit_contracts',   COUNT(*)::text FROM public.credit_contracts
UNION ALL SELECT '--- BUSINESS METRICS ---', ''
UNION ALL SELECT 'Total Modal Efektif', TO_CHAR(SUM(omset), 'FM999,999,999,999') FROM public.credit_contracts
UNION ALL SELECT 'Total DP',            TO_CHAR(SUM(dp), 'FM999,999,999,999')    FROM public.credit_contracts
UNION ALL SELECT 'Total Omset Jual',    TO_CHAR(SUM(total_loan_amount), 'FM999,999,999,999') FROM public.credit_contracts
UNION ALL SELECT 'Active Contracts',    COUNT(*)::text FROM public.credit_contracts WHERE status = 'active';
