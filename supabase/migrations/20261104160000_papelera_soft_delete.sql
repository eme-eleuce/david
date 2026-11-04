-- Papelera: soft delete con retención de 90 días
-- Ejecutar en: Supabase Dashboard → SQL Editor → Run

-- ---------------------------------------------------------------------------
-- Columnas deleted_at
-- ---------------------------------------------------------------------------

alter table public.procesos
  add column if not exists deleted_at timestamptz;

alter table public.documentos
  add column if not exists deleted_at timestamptz;

alter table public.expediente_documentos
  add column if not exists deleted_at timestamptz;

-- ---------------------------------------------------------------------------
-- Índices parciales (filas activas / papelera)
-- ---------------------------------------------------------------------------

create index if not exists procesos_active_empresa_id_idx
  on public.procesos (empresa_id)
  where deleted_at is null;

create index if not exists procesos_papelera_deleted_at_idx
  on public.procesos (deleted_at)
  where deleted_at is not null;

create index if not exists documentos_active_proceso_id_idx
  on public.documentos (proceso_id)
  where deleted_at is null;

create index if not exists documentos_papelera_deleted_at_idx
  on public.documentos (deleted_at)
  where deleted_at is not null;

create index if not exists expediente_documentos_active_empresa_id_idx
  on public.expediente_documentos (empresa_id)
  where deleted_at is null;

create index if not exists expediente_documentos_papelera_deleted_at_idx
  on public.expediente_documentos (deleted_at)
  where deleted_at is not null;

-- ---------------------------------------------------------------------------
-- Purge: borrar de verdad lo que lleva ≥ 90 días en papelera
-- (llamar manualmente o con pg_cron)
-- ---------------------------------------------------------------------------

create or replace function public.purge_papelera(retention_days integer default 90)
returns table (
  procesos_purged bigint,
  documentos_purged bigint,
  expediente_purged bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz := now() - make_interval(days => retention_days);
  n_procesos bigint;
  n_docs bigint;
  n_exp bigint;
begin
  -- Documentos sueltos (proceso aún activo o ya sin proceso)
  with doomed as (
    delete from public.documentos d
    where d.deleted_at is not null
      and d.deleted_at < cutoff
    returning 1
  )
  select count(*) into n_docs from doomed;

  with doomed as (
    delete from public.expediente_documentos e
    where e.deleted_at is not null
      and e.deleted_at < cutoff
    returning 1
  )
  select count(*) into n_exp from doomed;

  -- Procesos: cascade borra sus documentos restantes
  with doomed as (
    delete from public.procesos p
    where p.deleted_at is not null
      and p.deleted_at < cutoff
    returning 1
  )
  select count(*) into n_procesos from doomed;

  procesos_purged := n_procesos;
  documentos_purged := n_docs;
  expediente_purged := n_exp;
  return next;
end;
$$;

comment on function public.purge_papelera(integer) is
  'Elimina definitivamente procesos/documentos en papelera con más de N días (default 90).';
