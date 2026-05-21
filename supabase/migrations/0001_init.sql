-- =====================================================
-- Booking Portal — initial schema (white-label template)
-- =====================================================

-- ============ PROFILES (admin users) ============
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text,
  role text not null default 'assistant' check (role in ('owner','assistant')),
  avatar_url text,
  created_at timestamptz default now()
);

-- ============ PATIENTS ============
create table patients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  birthdate date,
  sport text,
  is_new boolean default true,
  admin_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_patients_email on patients (lower(email));
create index idx_patients_phone on patients (phone);

-- ============ APPOINTMENT TYPES ============
create table appointment_types (
  id uuid primary key default gen_random_uuid(),
  name_es text not null,
  name_en text,
  description_es text,
  description_en text,
  duration_minutes int not null,
  price_mxn numeric(10,2),
  color_hex text default '#a8c658',
  is_for_new_patients boolean default false,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

insert into appointment_types (name_es, name_en, duration_minutes, price_mxn, is_for_new_patients, sort_order) values
  ('Primera consulta', 'First consultation', 60, 800.00, true, 1),
  ('Consulta de seguimiento', 'Follow-up consultation', 30, 500.00, false, 2);

-- ============ APPOINTMENTS ============
create table appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references patients(id) on delete cascade not null,
  appointment_type_id uuid references appointment_types(id) not null,
  modality text not null check (modality in ('in_person','virtual')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed','cancelled','completed','no_show')),
  cancellation_token text unique not null default encode(gen_random_bytes(16),'hex'),
  meet_link text,
  google_event_id text,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded','not_applicable')),
  payment_intent_id text,
  amount_paid numeric(10,2),
  questionnaire_response jsonb,
  patient_reason text,
  admin_notes text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint chk_time_range check (end_time > start_time)
);
create index idx_appointments_start on appointments (start_time);
create index idx_appointments_patient on appointments (patient_id);
create index idx_appointments_status on appointments (status);

-- ============ WORKING HOURS ============
create table working_hours (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  is_active boolean default true,
  constraint chk_hours_range check (end_time > start_time)
);

insert into working_hours (day_of_week, start_time, end_time) values
  (1, '09:00', '14:00'),(1, '16:00', '19:00'),
  (2, '09:00', '14:00'),(2, '16:00', '19:00'),
  (3, '09:00', '14:00'),(3, '16:00', '19:00'),
  (4, '09:00', '14:00'),(4, '16:00', '19:00'),
  (5, '09:00', '14:00'),(5, '16:00', '19:00'),
  (6, '10:00', '13:00');

-- ============ BLOCKED PERIODS ============
create table blocked_periods (
  id uuid primary key default gen_random_uuid(),
  start_time timestamptz not null,
  end_time timestamptz not null,
  reason text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  constraint chk_block_range check (end_time > start_time)
);

-- ============ QUESTIONNAIRE QUESTIONS ============
create table questionnaire_questions (
  id uuid primary key default gen_random_uuid(),
  question_es text not null,
  question_en text,
  field_type text not null check (field_type in ('text','textarea','number','select','checkbox','date')),
  options jsonb,
  is_required boolean default false,
  sort_order int default 0,
  is_active boolean default true
);

insert into questionnaire_questions (question_es, question_en, field_type, is_required, sort_order) values
  ('¿Qué deporte practicas y con qué frecuencia?','What sport do you practice and how often?','textarea',true,1),
  ('¿Cuáles son tus objetivos principales?','What are your main goals?','textarea',true,2),
  ('¿Tienes alergias o intolerancias alimentarias?','Any food allergies or intolerances?','textarea',false,3),
  ('¿Tomas algún medicamento o suplemento actualmente?','Currently taking any medication or supplements?','textarea',false,4),
  ('¿Tienes alguna condición médica relevante?','Any relevant medical condition?','textarea',false,5),
  ('¿Cuántas horas duermes en promedio?','Average hours of sleep?','number',false,6);

-- ============ SETTINGS ============
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

insert into settings (key, value) values
  ('buffer_minutes', '10'::jsonb),
  ('min_booking_hours_ahead', '4'::jsonb),
  ('max_booking_days_ahead', '60'::jsonb),
  ('show_prices_publicly', 'true'::jsonb),
  ('default_language', '"es"'::jsonb),
  ('timezone', '"America/Mexico_City"'::jsonb),
  ('public_phone', '""'::jsonb),
  ('public_email', '""'::jsonb),
  ('public_address', '""'::jsonb),
  ('bio_es', '""'::jsonb),
  ('bio_en', '""'::jsonb),
  ('cancellation_policy_es', '"Puedes cancelar o reagendar tu cita hasta 12 horas antes sin costo."'::jsonb),
  ('cancellation_policy_en', '"You can cancel or reschedule up to 12 hours before your appointment at no cost."'::jsonb),
  ('cancellation_hours_limit', '12'::jsonb),
  ('payments_enabled', 'false'::jsonb),
  ('whatsapp_enabled', 'true'::jsonb),
  ('daily_summary_hour', '8'::jsonb);

-- ============ NOTIFICATION LOG ============
create table notification_log (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade,
  channel text check (channel in ('email','whatsapp','sms')),
  recipient_type text check (recipient_type in ('patient','admin')),
  template_key text,
  status text check (status in ('sent','failed','queued')),
  payload jsonb,
  error_message text,
  sent_at timestamptz default now()
);
create index idx_notif_appointment on notification_log (appointment_id);

-- ============ RLS ============
alter table profiles enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table appointment_types enable row level security;
alter table working_hours enable row level security;
alter table blocked_periods enable row level security;
alter table questionnaire_questions enable row level security;
alter table settings enable row level security;
alter table notification_log enable row level security;

-- Authenticated staff: full access (refine per-table later if needed)
create policy "staff_all_profiles" on profiles for all using (auth.role() = 'authenticated');
create policy "staff_all_patients" on patients for all using (auth.role() = 'authenticated');
create policy "staff_all_appointments" on appointments for all using (auth.role() = 'authenticated');
create policy "staff_all_appointment_types" on appointment_types for all using (auth.role() = 'authenticated');
create policy "staff_all_working_hours" on working_hours for all using (auth.role() = 'authenticated');
create policy "staff_all_blocked_periods" on blocked_periods for all using (auth.role() = 'authenticated');
create policy "staff_all_questionnaire" on questionnaire_questions for all using (auth.role() = 'authenticated');
create policy "staff_all_settings" on settings for all using (auth.role() = 'authenticated');
create policy "staff_all_notification_log" on notification_log for all using (auth.role() = 'authenticated');

-- Public read for safe config tables (public booking flow uses these)
create policy "public_read_active_types" on appointment_types for select using (is_active = true);
create policy "public_read_active_questions" on questionnaire_questions for select using (is_active = true);
create policy "public_read_settings" on settings for select using (true);
create policy "public_read_working_hours" on working_hours for select using (is_active = true);
create policy "public_read_blocked_periods" on blocked_periods for select using (true);

-- Note: public booking INSERT goes through API routes with SERVICE_ROLE_KEY.
