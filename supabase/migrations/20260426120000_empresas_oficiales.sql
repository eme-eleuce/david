-- Empresas oficiales POTTS OS + slugs (ejecutar en SQL Editor si ya tenías seed demo)

update public.empresas set nombre = 'MULTINUCLEAR', slug = 'multinuclear' where slug = 'alpha';
update public.empresas set nombre = 'KURS', slug = 'kurs' where slug = 'beta';
update public.empresas set nombre = 'ARANZECORP', slug = 'arenzecorp' where slug = 'gamma';
update public.empresas set nombre = 'DUROPEGASA', slug = 'duropegasa' where slug = 'delta';
update public.empresas set nombre = 'ECUASINERGY', slug = 'ecuasinergy' where slug = 'epsilon';

-- Si ya existían con otros nombres, alinear por slug oficial
update public.empresas set nombre = 'MULTINUCLEAR' where slug = 'multinuclear';
update public.empresas set nombre = 'KURS' where slug = 'kurs';
update public.empresas set nombre = 'ARANZECORP' where slug = 'arenzecorp';
update public.empresas set nombre = 'DUROPEGASA' where slug = 'duropegasa';
update public.empresas set nombre = 'ECUASINERGY' where slug = 'ecuasinergy';
