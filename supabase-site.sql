-- =========================================================================
-- AURA — جداول محتوى الموقع (للوحة تحكم الموقع)
-- شغّليه مرة واحدة في: Supabase → SQL Editor → Run
-- =========================================================================

-- الأساتذة الظاهرون على الموقع
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null, avatar text default '🌟',
  specialty text, services text, session_price numeric default 0,
  sort int default 0, published boolean default true
);
alter table public.teachers enable row level security;
drop policy if exists "public read teachers" on public.teachers;
create policy "public read teachers" on public.teachers for select to anon, authenticated using (published = true);
drop policy if exists "admin manage teachers" on public.teachers;
create policy "admin manage teachers" on public.teachers for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- نصوص السيكشنات القابلة للتعديل (مفتاح/قيمة)
create table if not exists public.site_content (
  key text primary key, value_ar text, value_en text, updated_at timestamptz default now()
);
alter table public.site_content enable row level security;
drop policy if exists "public read site content" on public.site_content;
create policy "public read site content" on public.site_content for select to anon, authenticated using (true);
drop policy if exists "admin manage site content" on public.site_content;
create policy "admin manage site content" on public.site_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- الكتب: عرض عام + صلاحية الأدمن للإدارة (إضافةً لمالكها)
drop policy if exists "admin manage books" on public.books;
create policy "admin manage books" on public.books for all to authenticated using (public.is_admin() or owner = auth.uid()) with check (public.is_admin() or owner = auth.uid());

-- ✅ خلص. الآن لوحة التحكم تقدر تدير الأساتذة والنصوص والكتب والكورسات.
