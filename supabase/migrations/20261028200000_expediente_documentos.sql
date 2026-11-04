-- Expediente empresarial: documentos por empresa (independientes de procesos)

create table if not exists public.expediente_documentos (
  id bigint generated always as identity primary key,
  empresa_id bigint not null references public.empresas (id) on delete cascade,
  nombre text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists expediente_documentos_empresa_id_idx
  on public.expediente_documentos (empresa_id);

alter table public.expediente_documentos enable row level security;

drop policy if exists expediente_documentos_authenticated_all
  on public.expediente_documentos;
create policy expediente_documentos_authenticated_all
  on public.expediente_documentos
  for all
  to authenticated
  using (true)
  with check (true);
