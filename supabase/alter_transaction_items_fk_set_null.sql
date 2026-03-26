-- Use this on existing databases that already created transaction_items with ON DELETE RESTRICT.
-- This keeps sales history rows but allows deleting products later.

alter table public.transaction_items
  alter column product_id drop not null;

alter table public.transaction_items
  drop constraint if exists transaction_items_product_id_fkey;

alter table public.transaction_items
  add constraint transaction_items_product_id_fkey
  foreign key (product_id)
  references public.products(id)
  on delete set null;
