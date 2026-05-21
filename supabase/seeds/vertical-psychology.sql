-- =====================================================
-- Vertical preset: Clinical psychology / therapy
-- =====================================================
begin;

delete from appointment_types;
insert into appointment_types
  (name_es, name_en, description_es, description_en, duration_minutes, price_mxn, is_for_new_patients, sort_order)
values
  ('Primera sesión', 'First session',
   'Sesión inicial de evaluación y construcción del plan terapéutico.',
   'Initial assessment and treatment plan.',
   60, 900.00, true, 1),
  ('Sesión de seguimiento', 'Follow-up session',
   'Sesión semanal o quincenal de psicoterapia.',
   'Weekly or biweekly therapy session.',
   50, 800.00, false, 2),
  ('Sesión de pareja', 'Couples session',
   'Sesión terapéutica para parejas.',
   'Therapy session for couples.',
   80, 1200.00, false, 3);

delete from questionnaire_questions;
insert into questionnaire_questions (question_es, question_en, field_type, is_required, sort_order) values
  ('¿Qué te motiva a buscar acompañamiento ahora?','What brings you to therapy now?','textarea',true,1),
  ('¿Has tenido procesos terapéuticos previos?','Have you had previous therapy?','textarea',false,2),
  ('¿Tomas algún medicamento psiquiátrico actualmente?','Currently taking any psychiatric medication?','textarea',false,3),
  ('¿Cómo describirías tu red de apoyo?','How would you describe your support network?','textarea',false,4),
  ('¿Hay algo más que quieras compartir antes de la primera sesión?','Anything else you''d like to share before the first session?','textarea',false,5);

insert into settings (key, value) values
  ('brand_profession_es', '"Psicólogo clínico"'::jsonb),
  ('brand_profession_en', '"Clinical psychologist"'::jsonb),
  ('hero_eyebrow_es', '"Acompañamiento terapéutico"'::jsonb),
  ('hero_eyebrow_en', '"Therapeutic support"'::jsonb),
  ('hero_title_es', '"Un espacio seguro para entenderte mejor"'::jsonb),
  ('hero_title_en', '"A safe space to understand yourself better"'::jsonb),
  ('hero_subtitle_es', '"Psicoterapia con un enfoque humano, confidencial y basado en evidencia. Atención presencial y en línea."'::jsonb),
  ('hero_subtitle_en', '"Psychotherapy with a human, confidential, evidence-based approach. In-person and online."'::jsonb),
  ('term_patient_es', '"Consultante"'::jsonb),
  ('term_patient_en', '"Client"'::jsonb),
  ('term_patient_plural_es', '"Consultantes"'::jsonb),
  ('term_patient_plural_en', '"Clients"'::jsonb),
  ('cancellation_hours_limit', '24'::jsonb),
  ('cancellation_policy_es', '"Puedes cancelar o reagendar hasta 24 horas antes sin costo. Cancelaciones tardías pueden tener cargo."'::jsonb),
  ('cancellation_policy_en', '"You can cancel or reschedule up to 24 hours before at no cost. Late cancellations may be charged."'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

commit;
