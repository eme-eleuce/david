-- Ampliar tipos de documento (actas y certificado) y migrar 'acta' legado

alter table public.documentos
  drop constraint if exists documentos_tipo_check;

update public.documentos
set tipo = 'acta_definitiva'
where tipo = 'acta';

alter table public.documentos
  add constraint documentos_tipo_check check (
    tipo in (
      'poliza',
      'factura',
      'contrato',
      'acta_provisional',
      'acta_definitiva',
      'certificado'
    )
  );
