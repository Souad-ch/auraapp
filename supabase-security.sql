-- =========================================================================
-- AURA — تقوية الحماية (Security hardening)
-- شغّلي هذا الملف في: Supabase → SQL Editor → New query → Run
-- (آمن تشغيله حتى لو سبق وشغّلتِ supabase-schema.sql)
-- =========================================================================

-- 1) تقييد إدخال الحجوزات من الزوار:
--    - الحالة تبدأ دائماً "pending" (لا يستطيع زائر تعيينها "confirmed")
--    - حدود لأطوال الحقول لمنع الإغراق/الإساءة (spam / abuse)
drop policy if exists "anon insert bookings" on public.bookings;
create policy "anon insert bookings"
  on public.bookings for insert to anon
  with check (
    status = 'pending'
    and char_length(customer_name) between 1 and 80
    and char_length(customer_contact) between 1 and 120
    and char_length(coalesce(master_name, '')) <= 120
    and char_length(coalesce(service, '')) <= 200
    and char_length(coalesce(master_id, '')) <= 64
    and char_length(coalesce(session_time, '')) <= 16
  );

-- 2) (طبقة حماية إضافية اختيارية — موصى بها)
--    اقصري قراءة/إدارة البيانات على إيميل الأدمن تحديداً، بحيث حتى لو
--    سجّل أحدهم حساباً لا يستطيع رؤية بيانات العملاء أو تعديل المحتوى.
--    👇 بدّلي 'YOUR_ADMIN_EMAIL@example.com' بإيميلك ثم أزيلي علامات التعليق.
--
-- do $$
-- declare admin_email text := 'YOUR_ADMIN_EMAIL@example.com';
-- begin
--   drop policy if exists "auth read bookings"   on public.bookings;
--   drop policy if exists "auth update bookings" on public.bookings;
--   drop policy if exists "auth all courses"     on public.courses;
--   drop policy if exists "auth all masters"     on public.masters;
--
--   execute format($f$create policy "admin read bookings" on public.bookings
--     for select to authenticated using (auth.jwt()->>'email' = %L)$f$, admin_email);
--   execute format($f$create policy "admin update bookings" on public.bookings
--     for update to authenticated using (auth.jwt()->>'email' = %L) with check (auth.jwt()->>'email' = %L)$f$, admin_email, admin_email);
--   execute format($f$create policy "admin all courses" on public.courses
--     for all to authenticated using (auth.jwt()->>'email' = %L) with check (auth.jwt()->>'email' = %L)$f$, admin_email, admin_email);
--   execute format($f$create policy "admin all masters" on public.masters
--     for all to authenticated using (auth.jwt()->>'email' = %L) with check (auth.jwt()->>'email' = %L)$f$, admin_email, admin_email);
-- end $$;

-- 3) تأكيد أن RLS مفعّل على كل الجداول (إجراء احترازي):
alter table public.bookings enable row level security;
alter table public.courses  enable row level security;
alter table public.masters  enable row level security;
