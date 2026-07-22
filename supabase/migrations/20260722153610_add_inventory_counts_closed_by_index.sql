-- Add covering index for the supervisor that closed an inventory count.

create index inventory_counts_closed_by_idx on public.inventory_counts(closed_by);
