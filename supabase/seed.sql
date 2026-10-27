-- Seed POTTS OS (empresas oficiales)
-- Ejecutar DESPUÉS de las migraciones

truncate table public.documentos, public.procesos, public.empresas
  restart identity cascade;

insert into public.empresas (nombre, slug, activa) values
  ('MULTINUCLEAR', 'multinuclear', true),
  ('KURS', 'kurs', true),
  ('ARANZECORP', 'arenzecorp', true),
  ('DUROPEGASA', 'duropegasa', true),
  ('ECUASINERGY', 'ecuasinergy', true);

insert into public.procesos (
  empresa_id, objeto, entidad_contratante, monto, anio, tipo_proceso, estado
)
select e.id, v.objeto, v.entidad, v.monto, v.anio, v.tipo, v.estado
from public.empresas e
join (
  values
    ('multinuclear', 'Construcción de sistema de detección de incendios', 'AQUAGOLD', 125000::numeric, 2025, 'Licitación pública', 'finalizado'),
    ('multinuclear', 'Mantenimiento de redes eléctricas industriales', 'GAD Municipal', 48200.50, 2025, 'Contratación directa', 'en_ejecucion'),
    ('multinuclear', 'Ampliación de subestación eléctrica 13.8 kV', 'Consorcio Andino', 178500, 2026, 'Licitación pública', 'en_ejecucion'),
    ('multinuclear', 'Reemplazo de luminarias LED industriales', 'AQUAGOLD', 51200, 2025, 'Contratación directa', 'finalizado'),
    ('multinuclear', 'Actualización de planos as-built eléctricos', 'TechCorp Latam', 15600, 2024, 'Cotización', 'finalizado'),
    ('kurs', 'Suministro de equipos de protección personal', 'Petroindustrial', 31500, 2024, 'Cotización', 'finalizado'),
    ('kurs', 'Instalación de tableros de control automatizado', 'AQUAGOLD', 89000, 2026, 'Licitación pública', 'en_revision'),
    ('kurs', 'Suministro de cable de potencia XLPE', 'Minera del Pacífico', 42300, 2025, 'Cotización', 'finalizado'),
    ('kurs', 'Certificación de calidad de soldadura estructural', 'Consorcio Andino', 12400, 2026, 'Cotización', 'en_revision'),
    ('kurs', 'Pruebas de aceptación de equipos MCC', 'AQUAGOLD', 22100, 2025, 'Contratación directa', 'finalizado'),
    ('arenzecorp', 'Servicio de ingeniería y supervisión de obra', 'Consorcio Andino', 156000, 2025, 'Licitación pública', 'finalizado'),
    ('arenzecorp', 'Reparación de transformadores de media tensión', 'GAD Provincial', 27800, 2026, 'Contratación directa', 'borrador'),
    ('arenzecorp', 'Mantenimiento preventivo de generadores', 'Petroindustrial', 26750, 2026, 'Contratación directa', 'en_ejecucion'),
    ('arenzecorp', 'Montaje de bandejas porta cables y canalizaciones', 'GAD Municipal', 67800, 2025, 'Licitación pública', 'finalizado'),
    ('duropegasa', 'Cableado estructurado y fibra óptica', 'TechCorp Latam', 64200, 2025, 'Cotización', 'finalizado'),
    ('duropegasa', 'Auditoría de seguridad eléctrica en planta', 'AQUAGOLD', 19500, 2026, 'Contratación directa', 'en_ejecucion'),
    ('duropegasa', 'Instalación de sistema de puesta a tierra', 'TechCorp Latam', 18900, 2024, 'Cotización', 'finalizado'),
    ('duropegasa', 'Servicio de termografía en tableros críticos', 'Petroindustrial', 9800, 2026, 'Contratación directa', 'en_ejecucion'),
    ('ecuasinergy', 'Diseño e instalación de UPS industriales', 'Minera del Pacífico', 210000, 2024, 'Licitación pública', 'finalizado'),
    ('ecuasinergy', 'Capacitación en normas NEC y seguridad', 'GAD Municipal', 8500, 2026, 'Cotización', 'en_revision'),
    ('ecuasinergy', 'Estudios de cortocircuito y coordinación de protecciones', 'GAD Provincial', 33400, 2026, 'Licitación pública', 'borrador'),
    ('ecuasinergy', 'Diseño de sistema fotovoltaico para planta', 'Minera del Pacífico', 145000, 2026, 'Licitación pública', 'en_revision')
) as v(slug, objeto, entidad, monto, anio, tipo, estado)
  on e.slug = v.slug;

insert into public.documentos (proceso_id, tipo, nombre, storage_path)
select p.id, d.tipo, d.nombre, d.path
from public.procesos p
join public.empresas e on e.id = p.empresa_id
join (
  values
    ('multinuclear', 'Construcción de sistema de detección de incendios', 'contrato', 'contrato-incendios.pdf', null::text),
    ('multinuclear', 'Construcción de sistema de detección de incendios', 'poliza', 'poliza-cumplimiento.pdf', null),
    ('multinuclear', 'Construcción de sistema de detección de incendios', 'factura', 'factura-001.pdf', null),
    ('multinuclear', 'Construcción de sistema de detección de incendios', 'acta_definitiva', 'acta-definitiva-entrega.pdf', null),
    ('multinuclear', 'Construcción de sistema de detección de incendios', 'certificado', 'certificado-cumplimiento.pdf', null),
    ('multinuclear', 'Mantenimiento de redes eléctricas industriales', 'contrato', 'contrato-mantenimiento.pdf', null),
    ('multinuclear', 'Mantenimiento de redes eléctricas industriales', 'acta_provisional', 'acta-provisional-avance.pdf', null),
    ('kurs', 'Instalación de tableros de control automatizado', 'factura', 'factura-avance-01.pdf', null)
) as d(slug, objeto, tipo, nombre, path)
  on e.slug = d.slug and p.objeto = d.objeto;
