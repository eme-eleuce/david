-- Tipos de proceso: Bienes, Servicio, Consultoría, Obra

alter table public.procesos
  drop constraint if exists procesos_tipo_check;

-- Mapear valores antiguos si existen
update public.procesos
set tipo_proceso = case tipo_proceso
  when 'Licitación pública' then 'Obra'
  when 'Contratación directa' then 'Servicio'
  when 'Cotización' then 'Bienes'
  else tipo_proceso
end
where tipo_proceso in (
  'Licitación pública',
  'Contratación directa',
  'Cotización'
);

alter table public.procesos
  add constraint procesos_tipo_check check (
    tipo_proceso in (
      'Bienes',
      'Servicio',
      'Consultoría',
      'Obra'
    )
  );
