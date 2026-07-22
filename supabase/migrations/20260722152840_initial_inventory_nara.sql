-- Initial schema and demo seed for Inventario Nara.
-- No passwords, API keys, service-role keys, or frontend secrets are stored here.

create schema if not exists private;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('Contador', 'Supervisor');
  end if;
  if not exists (select 1 from pg_type where typname = 'count_status') then
    create type public.count_status as enum ('Borrador', 'En revisión', 'Cerrado');
  end if;
  if not exists (select 1 from pg_type where typname = 'unit_type') then
    create type public.unit_type as enum ('Caja', 'Unidad');
  end if;
  if not exists (select 1 from pg_type where typname = 'history_event_type') then
    create type public.history_event_type as enum ('Creado', 'Enviado a revisión', 'Cerrado', 'Reabierto', 'Reactivado');
  end if;
end $$;

create table public.app_users (
  id text primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  role public.app_role not null,
  avatar text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id text primary key,
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.warehouses (
  id text primary key,
  client_id text not null references public.clients(id) on update cascade on delete restrict,
  name text not null,
  active boolean not null default true,
  last_count_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint warehouses_client_name_unique unique (client_id, name)
);

create table public.articles (
  id text primary key,
  code text not null unique,
  barcode text unique,
  name text not null,
  presentation public.unit_type not null,
  units_per_box integer not null default 1 check (units_per_box between 1 and 9999),
  applies_expiry boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.client_articles (
  client_id text not null references public.clients(id) on update cascade on delete cascade,
  article_id text not null references public.articles(id) on update cascade on delete restrict,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (client_id, article_id)
);

create table public.inventory_counts (
  id text primary key,
  client_id text not null references public.clients(id) on update cascade on delete restrict,
  warehouse_id text not null references public.warehouses(id) on update cascade on delete restrict,
  counter_id text not null references public.app_users(id) on update cascade on delete restrict,
  status public.count_status not null default 'Borrador',
  started_at timestamptz not null,
  expires_at timestamptz not null,
  submitted_at timestamptz,
  closed_at timestamptz,
  closed_by text references public.app_users(id) on update cascade on delete restrict,
  reopened_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_counts_closed_fields check (
    (status <> 'Cerrado') or (closed_at is not null and closed_by is not null)
  )
);

create table public.inventory_count_articles (
  count_id text not null references public.inventory_counts(id) on update cascade on delete cascade,
  article_id text not null references public.articles(id) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  primary key (count_id, article_id)
);

create table public.count_lines (
  id text primary key,
  count_id text not null references public.inventory_counts(id) on update cascade on delete cascade,
  article_id text not null references public.articles(id) on update cascade on delete restrict,
  unit_type public.unit_type not null,
  quantity integer not null check (quantity between 0 and 999999),
  total_units integer not null check (total_units >= 0),
  observation text not null default '' check (char_length(observation) <= 200),
  zero_confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint count_lines_one_per_article unique (count_id, article_id)
);

create table public.lots (
  id text primary key,
  line_id text not null references public.count_lines(id) on update cascade on delete cascade,
  lot_order integer not null check (lot_order > 0),
  unit_type public.unit_type not null,
  quantity integer not null check (quantity between 0 and 999999),
  total_units integer not null check (total_units >= 0),
  expiry_date date not null,
  observation text not null default '' check (char_length(observation) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lots_line_order_unique unique (line_id, lot_order)
);

create table public.history_events (
  id text primary key,
  count_id text not null references public.inventory_counts(id) on update cascade on delete cascade,
  type public.history_event_type not null,
  actor_id text not null references public.app_users(id) on update cascade on delete restrict,
  occurred_at timestamptz not null,
  reason text check (reason is null or char_length(reason) <= 300),
  created_at timestamptz not null default now()
);

create index warehouses_client_id_idx on public.warehouses(client_id);
create index client_articles_article_id_idx on public.client_articles(article_id);
create index inventory_counts_client_id_idx on public.inventory_counts(client_id);
create index inventory_counts_warehouse_id_idx on public.inventory_counts(warehouse_id);
create index inventory_counts_counter_id_idx on public.inventory_counts(counter_id);
create index inventory_count_articles_article_id_idx on public.inventory_count_articles(article_id);
create index count_lines_count_id_idx on public.count_lines(count_id);
create index count_lines_article_id_idx on public.count_lines(article_id);
create index lots_line_id_idx on public.lots(line_id);
create index history_events_count_id_idx on public.history_events(count_id);
create index history_events_actor_id_idx on public.history_events(actor_id);

create or replace function private.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select u.id
  from public.app_users u
  where u.auth_user_id = (select auth.uid())
    and u.active = true
  limit 1
$$;

create or replace function private.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select u.role
  from public.app_users u
  where u.auth_user_id = (select auth.uid())
    and u.active = true
  limit 1
$$;

create or replace function private.is_supervisor()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce((select private.current_app_role()) = 'Supervisor', false)
$$;

create or replace function private.is_counter()
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce((select private.current_app_role()) = 'Contador', false)
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.current_app_user_id() from public;
revoke all on function private.current_app_role() from public;
revoke all on function private.is_supervisor() from public;
revoke all on function private.is_counter() from public;
grant execute on function private.current_app_user_id() to authenticated;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.is_supervisor() to authenticated;
grant execute on function private.is_counter() to authenticated;

alter table public.app_users enable row level security;
alter table public.clients enable row level security;
alter table public.warehouses enable row level security;
alter table public.articles enable row level security;
alter table public.client_articles enable row level security;
alter table public.inventory_counts enable row level security;
alter table public.inventory_count_articles enable row level security;
alter table public.count_lines enable row level security;
alter table public.lots enable row level security;
alter table public.history_events enable row level security;

create policy "app users can read own profile or supervisor can read all"
on public.app_users for select
to authenticated
using (auth_user_id = (select auth.uid()) or (select private.is_supervisor()));

create policy "supervisor can manage app users"
on public.app_users for all
to authenticated
using ((select private.is_supervisor()))
with check ((select private.is_supervisor()));

create policy "authenticated can read clients"
on public.clients for select
to authenticated
using (true);

create policy "supervisor can manage clients"
on public.clients for all
to authenticated
using ((select private.is_supervisor()))
with check ((select private.is_supervisor()));

create policy "authenticated can read warehouses"
on public.warehouses for select
to authenticated
using (true);

create policy "supervisor can manage warehouses"
on public.warehouses for all
to authenticated
using ((select private.is_supervisor()))
with check ((select private.is_supervisor()));

create policy "authenticated can read articles"
on public.articles for select
to authenticated
using (true);

create policy "supervisor can manage articles"
on public.articles for all
to authenticated
using ((select private.is_supervisor()))
with check ((select private.is_supervisor()));

create policy "authenticated can read client articles"
on public.client_articles for select
to authenticated
using (true);

create policy "supervisor can manage client articles"
on public.client_articles for all
to authenticated
using ((select private.is_supervisor()))
with check ((select private.is_supervisor()));

create policy "authenticated can read inventory counts"
on public.inventory_counts for select
to authenticated
using (true);

create policy "counter can create own draft counts"
on public.inventory_counts for insert
to authenticated
with check (
  (select private.is_counter())
  and counter_id = (select private.current_app_user_id())
  and status = 'Borrador'
);

create policy "counter can update own active drafts"
on public.inventory_counts for update
to authenticated
using (
  (select private.is_counter())
  and counter_id = (select private.current_app_user_id())
  and status = 'Borrador'
  and now() <= expires_at
)
with check (
  counter_id = (select private.current_app_user_id())
  and status in ('Borrador', 'En revisión')
);

create policy "supervisor can manage inventory counts"
on public.inventory_counts for all
to authenticated
using ((select private.is_supervisor()))
with check ((select private.is_supervisor()));

create policy "authenticated can read count scope"
on public.inventory_count_articles for select
to authenticated
using (true);

create policy "counter can create scope for own draft"
on public.inventory_count_articles for insert
to authenticated
with check (
  exists (
    select 1
    from public.inventory_counts c
    where c.id = count_id
      and c.counter_id = (select private.current_app_user_id())
      and c.status = 'Borrador'
      and now() <= c.expires_at
  )
);

create policy "supervisor can manage count scope"
on public.inventory_count_articles for all
to authenticated
using ((select private.is_supervisor()))
with check ((select private.is_supervisor()));

create policy "authenticated can read count lines"
on public.count_lines for select
to authenticated
using (true);

create policy "counter can insert own draft lines"
on public.count_lines for insert
to authenticated
with check (
  exists (
    select 1
    from public.inventory_counts c
    join public.inventory_count_articles ca
      on ca.count_id = c.id and ca.article_id = count_lines.article_id
    where c.id = count_lines.count_id
      and c.counter_id = (select private.current_app_user_id())
      and c.status = 'Borrador'
      and now() <= c.expires_at
  )
);

create policy "counter can update own draft lines"
on public.count_lines for update
to authenticated
using (
  exists (
    select 1
    from public.inventory_counts c
    where c.id = count_lines.count_id
      and c.counter_id = (select private.current_app_user_id())
      and c.status = 'Borrador'
      and now() <= c.expires_at
  )
)
with check (
  exists (
    select 1
    from public.inventory_counts c
    where c.id = count_lines.count_id
      and c.counter_id = (select private.current_app_user_id())
      and c.status = 'Borrador'
      and now() <= c.expires_at
  )
);

create policy "supervisor can manage count lines"
on public.count_lines for all
to authenticated
using ((select private.is_supervisor()))
with check ((select private.is_supervisor()));

create policy "authenticated can read lots"
on public.lots for select
to authenticated
using (true);

create policy "counter can manage lots for own draft lines"
on public.lots for all
to authenticated
using (
  exists (
    select 1
    from public.count_lines l
    join public.inventory_counts c on c.id = l.count_id
    where l.id = lots.line_id
      and c.counter_id = (select private.current_app_user_id())
      and c.status = 'Borrador'
      and now() <= c.expires_at
  )
)
with check (
  exists (
    select 1
    from public.count_lines l
    join public.inventory_counts c on c.id = l.count_id
    where l.id = lots.line_id
      and c.counter_id = (select private.current_app_user_id())
      and c.status = 'Borrador'
      and now() <= c.expires_at
  )
);

create policy "supervisor can manage lots"
on public.lots for all
to authenticated
using ((select private.is_supervisor()))
with check ((select private.is_supervisor()));

create policy "authenticated can read history events"
on public.history_events for select
to authenticated
using (true);

create policy "counter can create own history events"
on public.history_events for insert
to authenticated
with check (
  exists (
    select 1
    from public.inventory_counts c
    where c.id = history_events.count_id
      and c.counter_id = (select private.current_app_user_id())
      and history_events.actor_id = (select private.current_app_user_id())
      and history_events.type in ('Creado', 'Enviado a revisión')
  )
);

create policy "supervisor can manage history events"
on public.history_events for all
to authenticated
using ((select private.is_supervisor()))
with check ((select private.is_supervisor()));

insert into public.app_users (id, auth_user_id, name, role, avatar) values
  ('maria', null, 'María López', 'Contador', 'ML'),
  ('carlos', null, 'Carlos Mena', 'Supervisor', 'CM')
on conflict (id) do nothing;

insert into public.clients (id, name, active) values
  ('client-ahorro', 'Distribuidora El Ahorro', true),
  ('client-union', 'Supermercado La Unión', true),
  ('client-progreso', 'Mayorista El Progreso', false),
  ('client-mini', 'Mini Market San Juan', true)
on conflict (id) do nothing;

insert into public.warehouses (id, client_id, name, active, last_count_at) values
  ('warehouse-ahorro-central', 'client-ahorro', 'Bodega central', true, '2026-07-17T16:00:00-06:00'),
  ('warehouse-ahorro-sur', 'client-ahorro', 'Bodega sur', true, null),
  ('warehouse-union-norte', 'client-union', 'Bodega norte', true, '2026-07-17T15:38:00-06:00'),
  ('warehouse-union-principal', 'client-union', 'Bodega principal', true, null),
  ('warehouse-progreso-principal', 'client-progreso', 'Bodega principal', false, null),
  ('warehouse-mini-principal', 'client-mini', 'Bodega principal', true, '2026-07-16T16:42:00-06:00')
on conflict (id) do nothing;

insert into public.articles (id, code, barcode, name, presentation, units_per_box, applies_expiry, active, sort_order) values
  ('a-00125', 'ART-00125', null, 'Café Nara clásico 250 g', 'Caja', 24, true, true, 1),
  ('a-00418', 'ART-00418', null, 'Galletas Nara chocolate 6x12', 'Caja', 72, false, true, 2),
  ('a-00805', 'ART-00805', null, 'Jugo Nara naranja 1 L', 'Unidad', 1, true, true, 3),
  ('a-00920', 'ART-00920', null, 'Cereal Nara 450 g', 'Caja', 12, false, true, 4),
  ('a-1001', '118120007', '118120007', 'Sabor Y Color Madona Tarro 12/900 Gr (31.7 Oz)', 'Unidad', 1, true, true, 5),
  ('a-1002', '118120004', '118120004', 'Toalla Nube Blanca 24/60 Hd', 'Caja', 12, false, true, 6),
  ('a-1003', '118120003', '118120003', 'Sopa Laky Men Caja Vaso De Pollo 12/75 Gr', 'Caja', 18, false, true, 7),
  ('a-1004', '132130023', '132130023', 'Bolsa En Rollo 2Lb 8"X12" (1X33X450)', 'Caja', 24, false, true, 8),
  ('a-1005', '0132130023R', '0132130023R', 'Biberon Polipro Tripack 3Pzas/8 Oz', 'Caja', 6, false, true, 9),
  ('a-1006', '132130035', '132130035', 'Shampoo Rosy Hierbas 12/32 Oz', 'Unidad', 1, false, true, 10),
  ('a-1007', '132130034', '132130034', 'Gel Barber Style For Men Savage 12/200 Gr', 'Caja', 18, false, true, 11),
  ('a-1008', '132130029', '132130029', 'Palillos Premier 1/144/500 Und', 'Caja', 24, false, true, 12),
  ('a-1009', '132130022', '132130022', 'Cilindro Orix Floral 24/270 Gr', 'Caja', 6, true, true, 13),
  ('a-1010', '118120043', '118120043', 'Paquete Shampoo Y Talco Scooby Doo 12/12 Oz', 'Unidad', 1, false, true, 14),
  ('a-1011', '118120015', '118120015', 'Shampoo Baby Olga Sherer 12/8 Oz', 'Caja', 18, false, true, 15),
  ('a-1012', '118130038', '118130038', 'Toalla Humeda Baby Star 24/40 Und', 'Caja', 24, false, true, 16),
  ('a-1013', '118120005', '118120005', 'Batichoco Fresa 24/350Gr', 'Caja', 6, false, true, 17),
  ('a-1014', '123110027', '123110027', 'Shampoo 2 En 1 Scooby Doo Chicle 12/16 Oz', 'Caja', 12, false, true, 18),
  ('a-1015', '132040011', '132040011', 'Biberon Mamila De Silicon Dinosaurio 25/4 Oz', 'Unidad', 1, false, true, 19),
  ('a-1016', 'ART-01016', null, 'Agua Nara 600 ml', 'Caja', 24, true, true, 20),
  ('a-1017', 'ART-01017', null, 'Refresco Nara cola 2 L', 'Caja', 6, false, true, 21),
  ('a-1018', 'ART-01018', null, 'Jabón líquido Nara 500 ml', 'Caja', 12, false, true, 22),
  ('a-1019', 'ART-01019', null, 'Detergente Nara 1 kg', 'Caja', 18, false, true, 23),
  ('a-1020', 'ART-01020', null, 'Papel toalla Nara 2 rollos', 'Unidad', 1, false, true, 24),
  ('a-1021', 'ART-01021', null, 'Servilletas Nara 100 u', 'Caja', 6, false, true, 25),
  ('a-1022', 'ART-01022', null, 'Garbanzos Nara 400 g', 'Caja', 12, false, true, 26),
  ('a-1023', 'ART-01023', null, 'Lentejas Nara 400 g', 'Caja', 18, false, true, 27),
  ('a-1024', 'ART-01024', null, 'Maíz dulce Nara 400 g', 'Caja', 24, true, true, 28),
  ('a-1025', 'ART-01025', null, 'Té Nara manzanilla 20 u', 'Unidad', 1, false, true, 29),
  ('a-1026', 'ART-01026', null, 'Chocolate Nara 100 g', 'Caja', 12, false, true, 30),
  ('a-1027', 'ART-01027', null, 'Pan tostado Nara 250 g', 'Caja', 18, false, true, 31),
  ('a-1028', 'ART-01028', null, 'Galletas saladas Nara 200 g', 'Caja', 24, false, true, 32),
  ('a-1029', 'ART-01029', null, 'Café instantáneo Nara 100 g', 'Caja', 6, false, true, 33),
  ('a-1030', 'ART-01030', null, 'Cereal Nara avena 300 g', 'Unidad', 1, false, true, 34),
  ('a-1031', 'ART-01031', null, 'Jugo Nara manzana 1 L', 'Caja', 18, false, true, 35),
  ('a-1032', 'ART-01032', null, 'Jugo Nara piña 1 L', 'Caja', 24, true, true, 36),
  ('a-1033', 'ART-01033', null, 'Salsa picante Nara 150 ml', 'Caja', 6, false, true, 37),
  ('a-1034', 'ART-01034', null, 'Especias Nara mixtas 50 g', 'Caja', 12, false, true, 38),
  ('a-1035', 'ART-01035', null, 'Desinfectante Nara 1 L', 'Caja', 18, false, true, 39),
  ('a-1036', 'ART-01036', null, 'Lavaplatos Nara 750 ml', 'Unidad', 1, false, true, 40),
  ('a-1037', 'ART-01037', null, 'Esponja Nara doble uso', 'Caja', 6, false, true, 41),
  ('a-1038', 'ART-01038', null, 'Artículo inactivo Nara 1', 'Caja', 12, false, false, 42),
  ('a-1039', 'ART-01039', null, 'Artículo inactivo Nara 2', 'Caja', 18, false, false, 43),
  ('a-1040', 'ART-01040', null, 'Artículo inactivo Nara 3', 'Unidad', 1, false, false, 44),
  ('a-1041', 'ART-01041', null, 'Artículo inactivo Nara 4', 'Caja', 6, false, false, 45)
on conflict (id) do nothing;

insert into public.client_articles (client_id, article_id, active)
select 'client-ahorro', id, true
from public.articles
where active = true and sort_order <= 38
on conflict (client_id, article_id) do nothing;

insert into public.client_articles (client_id, article_id, active)
select 'client-union', id, true
from public.articles
where active = true
on conflict (client_id, article_id) do nothing;

insert into public.client_articles (client_id, article_id, active)
select 'client-mini', id, true
from public.articles
where active = true and sort_order <= 15
on conflict (client_id, article_id) do nothing;

insert into public.client_articles (client_id, article_id, active)
select 'client-progreso', id, true
from public.articles
where active = true and sort_order <= 20
on conflict (client_id, article_id) do nothing;

insert into public.inventory_counts (id, client_id, warehouse_id, counter_id, status, started_at, expires_at, submitted_at, closed_at, closed_by) values
  ('count-draft-el-ahorro', 'client-ahorro', 'warehouse-ahorro-central', 'maria', 'Borrador', '2026-07-17T16:00:00-06:00', '2026-07-18T16:00:00-06:00', null, null, null),
  ('count-review-union', 'client-union', 'warehouse-union-norte', 'maria', 'En revisión', '2026-07-17T09:00:00-06:00', '2026-07-18T09:00:00-06:00', '2026-07-17T15:38:00-06:00', null, null),
  ('count-closed-mini', 'client-mini', 'warehouse-mini-principal', 'maria', 'Cerrado', '2026-07-16T10:00:00-06:00', '2026-07-17T10:00:00-06:00', null, '2026-07-16T16:42:00-06:00', 'carlos'),
  ('count-closed-ahorro', 'client-ahorro', 'warehouse-ahorro-central', 'maria', 'Cerrado', '2026-07-17T09:00:00-06:00', '2026-07-18T09:00:00-06:00', null, '2026-07-17T16:42:00-06:00', 'carlos')
on conflict (id) do nothing;

insert into public.inventory_count_articles (count_id, article_id)
select 'count-draft-el-ahorro', article_id
from public.client_articles
where client_id = 'client-ahorro' and active = true
on conflict (count_id, article_id) do nothing;

insert into public.inventory_count_articles (count_id, article_id)
select 'count-review-union', article_id
from public.client_articles ca
join public.articles a on a.id = ca.article_id
where ca.client_id = 'client-union' and ca.active = true and a.sort_order <= 38
on conflict (count_id, article_id) do nothing;

insert into public.inventory_count_articles (count_id, article_id)
select 'count-closed-mini', article_id
from public.client_articles ca
join public.articles a on a.id = ca.article_id
where ca.client_id = 'client-mini' and ca.active = true and a.sort_order <= 15
on conflict (count_id, article_id) do nothing;

insert into public.inventory_count_articles (count_id, article_id)
select 'count-closed-ahorro', article_id
from public.client_articles
where client_id = 'client-ahorro' and active = true
on conflict (count_id, article_id) do nothing;

insert into public.count_lines (id, count_id, article_id, unit_type, quantity, total_units, observation, zero_confirmed)
select 'count-draft-el-ahorro-line-' || article_id, 'count-draft-el-ahorro', article_id, 'Unidad', row_number() over (order by a.sort_order), row_number() over (order by a.sort_order), '', false
from public.inventory_count_articles ca
join public.articles a on a.id = ca.article_id
where ca.count_id = 'count-draft-el-ahorro' and a.sort_order <= 12
on conflict (id) do nothing;

update public.count_lines
set unit_type = 'Caja', quantity = 2, total_units = 96, observation = ''
where id = 'count-draft-el-ahorro-line-a-00125';

insert into public.lots (id, line_id, lot_order, unit_type, quantity, total_units, expiry_date, observation) values
  ('lot-coffee-1', 'count-draft-el-ahorro-line-a-00125', 1, 'Caja', 2, 48, '2026-12-15', 'Empaque en buen estado'),
  ('lot-coffee-2', 'count-draft-el-ahorro-line-a-00125', 2, 'Unidad', 48, 48, '2027-01-20', '')
on conflict (id) do nothing;

insert into public.count_lines (id, count_id, article_id, unit_type, quantity, total_units, observation, zero_confirmed)
select 'count-review-union-line-' || article_id, 'count-review-union', article_id, 'Unidad', row_number() over (order by a.sort_order), row_number() over (order by a.sort_order), '', false
from public.inventory_count_articles ca
join public.articles a on a.id = ca.article_id
where ca.count_id = 'count-review-union'
  and ca.article_id not in ('a-00418', 'a-00805', 'a-00920')
on conflict (id) do nothing;

insert into public.count_lines (id, count_id, article_id, unit_type, quantity, total_units, observation, zero_confirmed)
select 'count-closed-mini-line-' || article_id, 'count-closed-mini', article_id, 'Unidad', row_number() over (order by a.sort_order), row_number() over (order by a.sort_order), '', false
from public.inventory_count_articles ca
join public.articles a on a.id = ca.article_id
where ca.count_id = 'count-closed-mini'
on conflict (id) do nothing;

insert into public.count_lines (id, count_id, article_id, unit_type, quantity, total_units, observation, zero_confirmed)
select 'count-closed-ahorro-line-' || article_id, 'count-closed-ahorro', article_id, 'Unidad', row_number() over (order by a.sort_order), row_number() over (order by a.sort_order), '', false
from public.inventory_count_articles ca
join public.articles a on a.id = ca.article_id
where ca.count_id = 'count-closed-ahorro'
on conflict (id) do nothing;

update public.count_lines
set total_units = 544
where id = 'count-closed-ahorro-line-a-00125';

insert into public.history_events (id, count_id, type, actor_id, occurred_at, reason) values
  ('event-draft-created', 'count-draft-el-ahorro', 'Creado', 'maria', '2026-07-17T16:00:00-06:00', null),
  ('event-review-sent', 'count-review-union', 'Enviado a revisión', 'maria', '2026-07-17T15:38:00-06:00', null),
  ('event-mini-closed', 'count-closed-mini', 'Cerrado', 'carlos', '2026-07-16T16:42:00-06:00', null),
  ('event-ahorro-closed', 'count-closed-ahorro', 'Cerrado', 'carlos', '2026-07-17T16:42:00-06:00', null)
on conflict (id) do nothing;

/*
Rollback reference. Run manually only if this initial migration must be removed.
This does not modify auth.users.

begin;

drop policy if exists "supervisor can manage history events" on public.history_events;
drop policy if exists "counter can create own history events" on public.history_events;
drop policy if exists "authenticated can read history events" on public.history_events;
drop policy if exists "supervisor can manage lots" on public.lots;
drop policy if exists "counter can manage lots for own draft lines" on public.lots;
drop policy if exists "authenticated can read lots" on public.lots;
drop policy if exists "supervisor can manage count lines" on public.count_lines;
drop policy if exists "counter can update own draft lines" on public.count_lines;
drop policy if exists "counter can insert own draft lines" on public.count_lines;
drop policy if exists "authenticated can read count lines" on public.count_lines;
drop policy if exists "supervisor can manage count scope" on public.inventory_count_articles;
drop policy if exists "counter can create scope for own draft" on public.inventory_count_articles;
drop policy if exists "authenticated can read count scope" on public.inventory_count_articles;
drop policy if exists "supervisor can manage inventory counts" on public.inventory_counts;
drop policy if exists "counter can update own active drafts" on public.inventory_counts;
drop policy if exists "counter can create own draft counts" on public.inventory_counts;
drop policy if exists "authenticated can read inventory counts" on public.inventory_counts;
drop policy if exists "supervisor can manage client articles" on public.client_articles;
drop policy if exists "authenticated can read client articles" on public.client_articles;
drop policy if exists "supervisor can manage articles" on public.articles;
drop policy if exists "authenticated can read articles" on public.articles;
drop policy if exists "supervisor can manage warehouses" on public.warehouses;
drop policy if exists "authenticated can read warehouses" on public.warehouses;
drop policy if exists "supervisor can manage clients" on public.clients;
drop policy if exists "authenticated can read clients" on public.clients;
drop policy if exists "supervisor can manage app users" on public.app_users;
drop policy if exists "app users can read own profile or supervisor can read all" on public.app_users;

drop table if exists public.history_events;
drop table if exists public.lots;
drop table if exists public.count_lines;
drop table if exists public.inventory_count_articles;
drop table if exists public.inventory_counts;
drop table if exists public.client_articles;
drop table if exists public.warehouses;
drop table if exists public.articles;
drop table if exists public.clients;
drop table if exists public.app_users;

drop function if exists private.is_counter();
drop function if exists private.is_supervisor();
drop function if exists private.current_app_role();
drop function if exists private.current_app_user_id();

drop type if exists public.history_event_type;
drop type if exists public.unit_type;
drop type if exists public.count_status;
drop type if exists public.app_role;

commit;
*/
