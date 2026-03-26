-- Create a master table for each completed sale.
create table if not exists public.transactions (
  id bigint generated always as identity primary key,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  cash_given numeric(12, 2) not null check (cash_given >= 0),
  change_amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

-- Create detail rows for each product included in a transaction.
create table if not exists public.transaction_items (
  id bigint generated always as identity primary key,
  transaction_id bigint not null references public.transactions(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12, 2) not null check (line_total >= 0)
);

create index if not exists idx_transaction_items_transaction_id
  on public.transaction_items (transaction_id);

create index if not exists idx_transaction_items_product_id
  on public.transaction_items (product_id);

create index if not exists idx_transactions_created_at
  on public.transactions (created_at desc);

-- Optional helper view for quick reporting.
create or replace view public.transaction_summary as
select
  t.id,
  t.created_at,
  t.total_amount,
  t.cash_given,
  t.change_amount,
  coalesce(sum(ti.quantity), 0) as total_items,
  count(ti.id) as line_count
from public.transactions t
left join public.transaction_items ti on ti.transaction_id = t.id
group by t.id;

-- Note:
-- If RLS is enabled, add policies based on your auth model before using these tables in app code.
