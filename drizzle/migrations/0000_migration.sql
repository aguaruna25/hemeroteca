create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.assign_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.assign_first_admin();

create table public.magazines (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issue text not null default '',
  year int not null,
  description text not null default '',
  cover_url text,
  download_url text,
  created_at timestamptz not null default now()
);
grant select on public.magazines to anon, authenticated;
grant insert, update, delete on public.magazines to authenticated;
grant all on public.magazines to service_role;
alter table public.magazines enable row level security;
create policy "public read magazines" on public.magazines for select to anon, authenticated using (true);
create policy "admin write magazines" on public.magazines for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.news (
  id uuid primary key default gen_random_uuid(),
  tag text not null default 'Noticia',
  title text not null,
  summary text not null default '',
  image_url text,
  created_at timestamptz not null default now()
);
grant select on public.news to anon, authenticated;
grant insert, update, delete on public.news to authenticated;
grant all on public.news to service_role;
alter table public.news enable row level security;
create policy "public read news" on public.news for select to anon, authenticated using (true);
create policy "admin write news" on public.news for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create policy "public read covers" on storage.objects for select using (bucket_id = 'covers');
create policy "admin upload covers" on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and public.has_role(auth.uid(), 'admin'));
create policy "admin delete covers" on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and public.has_role(auth.uid(), 'admin'));

insert into public.magazines (title, issue, year, description) values
 ('Pixel Press','Nº 120',2026,'Especial lanzamientos de otoño.'),
 ('Joystick','Nº 87',2018,'Guía completa de mundos abiertos.'),
 ('Super Play','Nº 34',2004,'Los mejores juegos de la generación.'),
 ('Bit Mag','Nº 12',1995,'El salto a los gráficos 3D.');
insert into public.news (tag, title, summary) values
 ('Noticia','Se anuncia la remasterización de un clásico de los 90','Un regreso muy esperado.'),
 ('Industria','Las consolas portátiles viven su segunda era dorada','Más modelos que nunca.');