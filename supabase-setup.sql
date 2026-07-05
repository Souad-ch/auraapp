-- =========================================================================
-- AURA — ملف الإعداد الموحّد (شغّليه مرة واحدة على مشروع Supabase الجديد)
-- Supabase → SQL Editor → New query → الصقي كل هذا → Run
-- يجمع: الحجوزات + الأدوار + الكورسات + الكتب + المشتريات + الاشتراكات + الدوال.
-- آمن لإعادة التشغيل (يستخدم if not exists / or replace).
-- =========================================================================

-- ========== 1) الأدوار (profiles) ==========
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'customer',   -- admin | master | customer
  full_name  text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin'); $$;
create or replace function public.my_role() returns text
  language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'customer'); $$;

-- ========== 2) الحجوزات (bookings) ==========
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  master_id text, master_name text, service text,
  customer_name text not null, customer_contact text not null,
  session_date date, session_time text,
  status text not null default 'pending'
);
alter table public.bookings enable row level security;
drop policy if exists "anon insert bookings" on public.bookings;
create policy "anon insert bookings" on public.bookings for insert to anon
  with check (status = 'pending'
    and char_length(customer_name) between 1 and 80
    and char_length(customer_contact) between 1 and 120);
drop policy if exists "admin read bookings" on public.bookings;
create policy "admin read bookings" on public.bookings for select to authenticated using (public.is_admin());
drop policy if exists "admin update bookings" on public.bookings;
create policy "admin update bookings" on public.bookings for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ========== 3) الكورسات (courses) ==========
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  owner uuid references auth.users(id),
  title text not null, description text, price numeric default 0,
  cover text default '📘', content_url text, published boolean default true
);
alter table public.courses enable row level security;
drop policy if exists "owner manage courses" on public.courses;
create policy "owner manage courses" on public.courses for all to authenticated
  using (owner = auth.uid() or public.is_admin()) with check (owner = auth.uid() or public.is_admin());
create or replace view public.courses_public as
  select id, title, description, price, cover, owner, published, created_at from public.courses where published = true;
grant select on public.courses_public to anon, authenticated;

-- ========== 4) الكتب (books) ==========
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  owner uuid references auth.users(id),
  title text not null, description text, price numeric default 0,
  cover text default '📖', file_url text, published boolean default true
);
alter table public.books enable row level security;
drop policy if exists "owner manage books" on public.books;
create policy "owner manage books" on public.books for all to authenticated
  using (owner = auth.uid() or public.is_admin()) with check (owner = auth.uid() or public.is_admin());
create or replace view public.books_public as
  select id, title, description, price, cover, owner, published, created_at from public.books where published = true;
grant select on public.books_public to anon, authenticated;

-- ========== 5) المشتريات (enrollments) ==========
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid references auth.users(id),
  product_type text, product_id uuid, granted_by uuid default auth.uid()
);
alter table public.enrollments enable row level security;
drop policy if exists "own enrollments read" on public.enrollments;
create policy "own enrollments read" on public.enrollments for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "grant enrollments" on public.enrollments;
create policy "grant enrollments" on public.enrollments for insert to authenticated with check (public.is_admin() or public.my_role() = 'master');

-- ========== 6) الاشتراكات (subscriptions) ==========
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique,
  plan text, status text default 'active',
  started_at timestamptz default now(), expires_at timestamptz
);
alter table public.subscriptions enable row level security;
drop policy if exists "own subscription read" on public.subscriptions;
create policy "own subscription read" on public.subscriptions for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin manage subs" on public.subscriptions;
create policy "admin manage subs" on public.subscriptions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ========== 7) الدوال (RPCs) ==========
create or replace function public.master_stats() returns json
  language sql stable security definer set search_path = public as $$
  select json_build_object(
    'my_courses', (select count(*) from public.courses where owner = auth.uid()),
    'course_students', (select count(*) from public.enrollments e join public.courses c on c.id = e.product_id where c.owner = auth.uid() and e.product_type='course'),
    'book_sales', (select count(*) from public.enrollments e join public.books b on b.id = e.product_id where b.owner = auth.uid() and e.product_type='book')
  ); $$;

create or replace function public.course_content(cid uuid) returns json
  language sql stable security definer set search_path = public as $$
  select case when public.is_admin() or exists(
      select 1 from public.enrollments e where e.user_id = auth.uid() and e.product_id = cid and e.product_type='course')
    then (select json_build_object('title', title, 'content_url', content_url) from public.courses where id = cid)
    else null end; $$;

create or replace function public.my_courses() returns setof public.courses_public
  language sql stable security definer set search_path = public as $$
  select cp.* from public.courses_public cp
  join public.enrollments e on e.product_id = cp.id and e.product_type='course'
  where e.user_id = auth.uid(); $$;

create or replace function public.admin_grant(user_email text, cid uuid, ptype text default 'course')
  returns text language plpgsql security definer set search_path = public as $$
declare uid uuid;
begin
  if not (public.is_admin() or public.my_role() = 'master') then return 'not_allowed'; end if;
  select id into uid from auth.users where email = lower(user_email);
  if uid is null then return 'user_not_found'; end if;
  insert into public.enrollments (user_id, product_type, product_id) values (uid, ptype, cid);
  return 'granted';
end; $$;

-- =========================================================================
-- ✅ خلص! بعد ما تشغّلي هذا الملف:
--   1) Authentication → فعّلي "Allow new users to sign up".
--   2) سجّلي دخول مرة من account.html بإيميلك.
--   3) نفّذي (بدّلي إيميلك) لتصيري أدمن:
--      update public.profiles set role='admin'
--        where id=(select id from auth.users where email='YOUR_EMAIL');
--   4) لكل أستاذ (بعد ما يعمل حساب):
--      update public.profiles set role='master'
--        where id=(select id from auth.users where email='MASTER_EMAIL');
-- =========================================================================
