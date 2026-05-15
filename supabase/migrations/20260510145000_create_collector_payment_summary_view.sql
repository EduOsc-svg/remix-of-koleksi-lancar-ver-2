-- View: collector_payment_summary
-- Summarizes payments per collector, includes distinct consumer (customer) count
create or replace view public.collector_payment_summary as
select
  c.id as collector_id,
  c.collector_code,
  c.name as collector_name,
  count(pl.id) as total_payments,
  coalesce(sum(pl.amount_paid), 0) as total_amount_paid,
  count(distinct cc.customer_id) as distinct_customers_count,
  min(pl.payment_date) as first_payment_date,
  max(pl.payment_date) as last_payment_date
from public.collectors c
left join public.payment_logs pl on pl.collector_id = c.id
left join public.credit_contracts cc on cc.id = pl.contract_id
group by c.id, c.collector_code, c.name;

alter view public.collector_payment_summary owner to postgres;

-- Ensure the view is readable by authenticated users (consistent with other read policies)
revoke all on public.collector_payment_summary from public;
grant select on public.collector_payment_summary to authenticated;
