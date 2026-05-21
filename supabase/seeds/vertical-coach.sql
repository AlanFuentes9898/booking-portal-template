-- =====================================================
-- Vertical preset: Coach / mentor (life, business, fitness)
-- =====================================================
begin;

delete from appointment_types;
insert into appointment_types
  (name_es, name_en, description_es, description_en, duration_minutes, price_mxn, is_for_new_patients, sort_order)
values
  ('Sesión inicial', 'Discovery session',
   'Sesión inicial sin costo para conocernos y definir objetivos.',
   'Free intro session to get to know each other and set goals.',
   45, 0, true, 1),
  ('Sesión 1:1', '1:1 session',
   'Sesión individual de coaching o mentoría.',
   'Individual coaching or mentorship session.',
   60, 1500.00, false, 2),
  ('Sesión intensiva', 'Intensive session',
   'Sesión profunda de 90 minutos para temas estratégicos.',
   'Deep 90-minute session for strategic topics.',
   90, 2200.00, false, 3);

delete from questionnaire_questions;
insert into questionnaire_questions (question_es, question_en, field_type, is_required, sort_order) values
  ('¿Cuál es el objetivo principal que quieres trabajar?','What is the main goal you want to work on?','textarea',true,1),
  ('¿Por qué este momento y no antes?','Why now and not before?','textarea',false,2),
  ('¿Qué has intentado y no ha funcionado?','What have you tried that hasn''t worked?','textarea',false,3),
  ('¿Cómo medirás el éxito en 3 meses?','How will you measure success in 3 months?','textarea',false,4);

insert into settings (key, value) values
  ('brand_profession_es', '"Coach"'::jsonb),
  ('brand_profession_en', '"Coach"'::jsonb),
  ('hero_eyebrow_es', '"Coaching personal"'::jsonb),
  ('hero_eyebrow_en', '"Personal coaching"'::jsonb),
  ('hero_title_es', '"Acelera tu próximo nivel"'::jsonb),
  ('hero_title_en', '"Accelerate your next level"'::jsonb),
  ('hero_subtitle_es', '"Coaching 1:1 enfocado en resultados. Sesiones presenciales o por videollamada."'::jsonb),
  ('hero_subtitle_en', '"Results-focused 1:1 coaching. In-person or video sessions."'::jsonb),
  ('term_patient_es', '"Cliente"'::jsonb),
  ('term_patient_en', '"Client"'::jsonb),
  ('term_patient_plural_es', '"Clientes"'::jsonb),
  ('term_patient_plural_en', '"Clients"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

commit;
