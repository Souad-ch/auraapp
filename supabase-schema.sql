-- =========================================================================
-- AURA — Supabase schema (Phases 2–4)
-- شغّلي هذا الملف مرة واحدة في: Supabase → SQL Editor → New query → Run
-- ثم ضعي url + anonKey في config.js داخل supabase{}.
-- لإدارة المحتوى من لوحة admin.html أنشئي مستخدماً في:
--   Supabase → Authentication → Users → Add user (إيميل + كلمة مرور).
-- =========================================================================

-- ---------- جدول الحجوزات — Bookings ----------
create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  master_id        text,
  master_name      text,
  service          text,
  customer_name    text not null,
  customer_contact text not null,
  session_date     date not null,
  session_time     text not null,
  status           text not null default 'pending'   -- pending | confirmed | cancelled
);
alter table public.bookings enable row level security;

drop policy if exists "anon insert bookings" on public.bookings;
create policy "anon insert bookings"
  on public.bookings for insert to anon with check (true);

-- الحجوزات تُقرأ وتُدار من قبل المستخدم المسجَّل (الأدمن) فقط.
drop policy if exists "auth read bookings" on public.bookings;
create policy "auth read bookings"
  on public.bookings for select to authenticated using (true);

drop policy if exists "auth update bookings" on public.bookings;
create policy "auth update bookings"
  on public.bookings for update to authenticated using (true) with check (true);


-- ---------- جدول الكورسات — Courses ----------
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  icon        text default '📘',
  title_ar    text not null,
  title_en    text,
  desc_ar     text,
  desc_en     text,
  amount      numeric default 0,
  sort        int default 0,
  active      boolean default true
);
alter table public.courses enable row level security;

-- الجميع يقرأ الكورسات المفعّلة؛ الأدمن (مسجَّل) يضيف/يعدّل/يحذف.
drop policy if exists "public read courses" on public.courses;
create policy "public read courses"
  on public.courses for select to anon, authenticated using (active = true);

drop policy if exists "auth write courses" on public.courses;
create policy "auth all courses"
  on public.courses for all to authenticated using (true) with check (true);


-- ---------- جدول الأساتذة — Masters ----------
create table if not exists public.masters (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  avatar        text default '🌟',
  name_ar       text not null,
  name_en       text,
  specialty_ar  text,
  specialty_en  text,
  services_ar   text,
  services_en   text,
  session_price numeric default 0,
  sort          int default 0,
  active        boolean default true
);
alter table public.masters enable row level security;

drop policy if exists "public read masters" on public.masters;
create policy "public read masters"
  on public.masters for select to anon, authenticated using (active = true);

drop policy if exists "auth all masters" on public.masters;
create policy "auth all masters"
  on public.masters for all to authenticated using (true) with check (true);
