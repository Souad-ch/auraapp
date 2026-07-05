-- =========================================================================
-- AURA — Platform schema (Phase 2): roles, courses, books, enrollments, subs
-- شغّلي هذا الملف مرة واحدة في: Supabase → SQL Editor → New query → Run
-- (آمن تشغيله فوق ما سبق).
-- بعده: Storage غير مطلوب للبداية (نستخدم روابط فيديو). Auth: Email مفعّل.
-- لجعل حسابك أدمن: نفّذي في آخر الملف السطر المخصّص بإيميلك.
-- =========================================================================

-- ---------- profiles: دور كل مستخدم ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'customer',   -- admin | master | customer
  full_name  text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "own profile read" on public.profiles;
create policy "own profile read" on public.profiles
  for select to authenticated using (id = auth.uid());
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- إنشاء profile تلقائياً عند التسجيل
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- دوال مساعدة (security definer لتفادي التكرار في السياسات)
create or replace function public.is_admin() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
create or replace function public.my_role() returns text
  language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'customer');
$$;

-- ---------- courses: كورسات يملكها الأستاذ ----------
create table if not exists public.courses (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  owner        uuid references auth.users(id),
  title        text not null,
  description  text,
  price        numeric default 0,
  cover        text default '📘',
  content_url  text,            -- رابط فيديو الكورس (يُكشف للمشترِكين فقط)
  published    boolean default true
);
alter table public.courses enable row level security;
-- الأستاذ/الأدمن يديرون؛ لا قراءة عامة للجدول (المحتوى محمي).
drop policy if exists "owner manage courses" on public.courses;
create policy "owner manage courses" on public.courses
  for all to authenticated
  using (owner = auth.uid() or public.is_admin())
  with check (owner = auth.uid() or public.is_admin());

-- عرض عام للكورسات بدون رابط المحتوى (للموقع)
create or replace view public.courses_public as
  select id, title, description, price, cover, owner, published, created_at
  from public.courses where published = true;
grant select on public.courses_public to anon, authenticated;

-- ---------- books ----------
create table if not exists public.books (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  owner       uuid references auth.users(id),
  title       text not null,
  description text,
  price       numeric default 0,
  cover       text default '📖',
  file_url    text,
  published   boolean default true
);
alter table public.books enable row level security;
drop policy if exists "owner manage books" on public.books;
create policy "owner manage books" on public.books
  for all to authenticated
  using (owner = auth.uid() or public.is_admin())
  with check (owner = auth.uid() or public.is_admin());
create or replace view public.books_public as
  select id, title, description, price, cover, owner, published, created_at
  from public.books where published = true;
grant select on public.books_public to anon, authenticated;

-- ---------- enrollments: مين اشترى/وصل لأي منتج ----------
create table if not exists public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  user_id      uuid references auth.users(id),
  product_type text,             -- course | book
  product_id   uuid,
  granted_by   uuid default auth.uid()
);
alter table public.enrollments enable row level security;
-- الزبون يشوف تسجيلاته فقط
drop policy if exists "own enrollments read" on public.enrollments;
create policy "own enrollments read" on public.enrollments
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
-- الأدمن أو الأستاذ يمنح الوصول
drop policy if exists "grant enrollments" on public.enrollments;
create policy "grant enrollments" on public.enrollments
  for insert to authenticated with check (public.is_admin() or public.my_role() = 'master');

-- ---------- subscriptions ----------
create table if not exists public.subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) unique,
  plan       text,
  status     text default 'active',      -- active | expired | cancelled
  started_at timestamptz default now(),
  expires_at timestamptz
);
alter table public.subscriptions enable row level security;
drop policy if exists "own subscription read" on public.subscriptions;
create policy "own subscription read" on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists "admin manage subs" on public.subscriptions;
create policy "admin manage subs" on public.subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- RPC: إحصائيات الأستاذ (أرقام فقط، بدون بيانات طلاب) ----------
create or replace function public.master_stats() returns json
  language sql stable security definer set search_path = public as $$
  select json_build_object(
    'my_courses', (select count(*) from public.courses where owner = auth.uid()),
    'course_students', (select count(*) from public.enrollments e
        join public.courses c on c.id = e.product_id
        where c.owner = auth.uid() and e.product_type = 'course'),
    'book_sales', (select count(*) from public.enrollments e
        join public.books b on b.id = e.product_id
        where b.owner = auth.uid() and e.product_type = 'book')
  );
$$;

-- ---------- RPC: محتوى الكورس (يُكشف للمشترِك فقط) ----------
create or replace function public.course_content(cid uuid) returns json
  language sql stable security definer set search_path = public as $$
  select case when public.is_admin() or exists(
      select 1 from public.enrollments e
      where e.user_id = auth.uid() and e.product_id = cid and e.product_type = 'course'
    )
    then (select json_build_object('title', title, 'content_url', content_url)
          from public.courses where id = cid)
    else null end;
$$;

-- ---------- RPC: كورساتي (للزبون) ----------
create or replace function public.my_courses() returns setof public.courses_public
  language sql stable security definer set search_path = public as $$
  select cp.* from public.courses_public cp
  join public.enrollments e on e.product_id = cp.id and e.product_type = 'course'
  where e.user_id = auth.uid();
$$;

-- ---------- RPC: منح الوصول بعد الدفع (أدمن/أستاذ) ----------
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
-- 👑 اجعلي حسابك أدمن: بدّلي الإيميل ثم نفّذي (بعد أن تسجّلي دخول مرة):
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
--
-- 👩‍🏫 لجعل مستخدم أستاذاً:
-- update public.profiles set role = 'master'
--   where id = (select id from auth.users where email = 'MASTER_EMAIL');
-- =========================================================================
