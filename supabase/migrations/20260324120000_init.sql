-- POTTS OS · esquema inicial (empresas, procesos, documentos)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists public.empresas (
  id bigint generated always as identity primary key,
  nombre text not null,
  slug text not null,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  constraint empresas_slug_unique unique (slug)
);

create table if not exists public.procesos (
  id bigint generated always as identity primary key,
  empresa_id bigint not null references public.empresas (id) on delete cascade,
  objeto text not null,
  entidad_contratante text not null,
  monto numeric(14, 2) not null default 0,
  anio integer not null,
  tipo_proceso text not null,
  estado text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint procesos_estado_check check (
    estado in (
      'borrador',
      'en_ejecucion',
      'en_revision',
      'finalizado',
      'cancelado'
    )
  ),
  constraint procesos_tipo_check check (
    tipo_proceso in (
      'Licitación pública',
      'Contratación directa',
      'Cotización'
    )
  )
);

create index if not exists procesos_empresa_id_idx on public.procesos (empresa_id);
create index if not exists procesos_estado_idx on public.procesos (estado);
create index if not exists procesos_anio_idx on public.procesos (anio);

create table if not exists public.documentos (
  id bigint generated always as identity primary key,
  proceso_id bigint not null references public.procesos (id) on delete cascade,
  tipo text not null,
  nombre text not null,
  storage_path text,
  created_at timestamptz not null default now(),
  constraint documentos_tipo_check check (
    tipo in (
      'poliza',
      'factura',
      'contrato',
      'acta_provisional',
      'acta_definitiva',
      'certificado'
    )
  )
);

create index if not exists documentos_proceso_id_idx on public.documentos (proceso_id);
create index if not exists documentos_proceso_tipo_idx on public.documentos (proceso_id, tipo);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists procesos_set_updated_at on public.procesos;
create trigger procesos_set_updated_at
  before update on public.procesos
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: usuario autenticado tiene acceso completo (MVP 1 usuario / equipo)
-- ---------------------------------------------------------------------------

alter table public.empresas enable row level security;
alter table public.procesos enable row level security;
alter table public.documentos enable row level security;

drop policy if exists empresas_authenticated_all on public.empresas;
create policy empresas_authenticated_all
  on public.empresas
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists procesos_authenticated_all on public.procesos;
create policy procesos_authenticated_all
  on public.procesos
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists documentos_authenticated_all on public.documentos;
create policy documentos_authenticated_all
  on public.documentos
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Storage bucket para PDFs (upload real más adelante)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('documentos', 'documentos', false)
on conflict (id) do nothing;

drop policy if exists documentos_storage_authenticated on storage.objects;
create policy documentos_storage_authenticated
  on storage.objects
  for all
  to authenticated
  using (bucket_id = 'documentos')
  with check (bucket_id = 'documentos');
