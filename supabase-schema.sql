-- =========================================================================
-- AURA — Supabase schema (Phase 2)
-- شغّلي هذا الملف مرة واحدة في: Supabase → SQL Editor → New query → Run
-- ثم ضعي url + anonKey في config.js داخل supabase{}.
-- =========================================================================

-- جدول الحجوزات — Bookings
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

-- تفعيل أمان الصفوف — Row Level Security
alter table public.bookings enable row level security;

-- السماح للزوار بإرسال طلب حجز فقط (إدراج)، دون القراءة العامة.
-- Allow anonymous visitors to INSERT a booking request only (no public read).
drop policy if exists "anon can insert bookings" on public.bookings;
create policy "anon can insert bookings"
  on public.bookings for insert
  to anon
  with check (true);

-- القراءة/التعديل تتم من لوحة Supabase أو بمفتاح الخدمة (service_role) فقط.
-- Reading/updating is done from the Supabase dashboard or with the service_role key only.
