-- Tabel app_settings menyimpan konfigurasi aplikasi (key/value)
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "Authenticated can read app_settings" on public.app_settings;
create policy "Authenticated can read app_settings"
on public.app_settings for select
to authenticated
using (true);

drop policy if exists "Authenticated can update app_settings" on public.app_settings;
create policy "Authenticated can update app_settings"
on public.app_settings for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can insert app_settings" on public.app_settings;
create policy "Authenticated can insert app_settings"
on public.app_settings for insert
to authenticated
with check (true);

insert into public.app_settings (key, value)
values ('admin_password', 'Kemuje97')
on conflict (key) do nothing;
