-- View: collector_handover_summary
-- Summarizes coupon handovers per collector, includes distinct consumer (customer) count
create or replace view public.collector_handover_summary as
select
  col.id as collector_id,
  col.collector_code,
  col.name as collector_name,
  count(ch.id) as total_handovers,
  coalesce(sum(ch.coupon_count), 0) as total_coupons_handed_over,
  count(distinct cc.customer_id) as distinct_customers_count,
  min(ch.handover_date) as first_handover_date,
  max(ch.handover_date) as last_handover_date
from public.collectors col
left join public.coupon_handovers ch on ch.collector_id = col.id
left join public.credit_contracts cc on cc.id = ch.contract_id
group by col.id, col.collector_code, col.name;

alter view public.collector_handover_summary owner to postgres;

revoke all on public.collector_handover_summary from public;
grant select on public.collector_handover_summary to authenticated;
