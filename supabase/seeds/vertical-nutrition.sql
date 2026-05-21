-- =====================================================
-- Vertical preset: Nutrition / sports nutrition
-- =====================================================
begin;

delete from appointment_types;
insert into appointment_types
  (name_es, name_en, description_es, description_en, duration_minutes, price_mxn, is_for_new_patients, sort_order)
values
  ('Primera consulta', 'First consultation',
   'Evaluación inicial, antropometría, hábitos y objetivos. Plan personalizado.',
   'Initial assessment, anthropometry, habits and goals. Personalized plan.',
   60, 800.00, true, 1),
  ('Consulta de seguimiento', 'Follow-up consultation',
   'Revisión de progreso, ajustes al plan y resolución de dudas.',
   'Progress review, plan adjustments and Q&A.',
   30, 500.00, false, 2),
  ('Antropometría', 'Body composition',
   'Mediciones detalladas, composición corporal e interpretación.',
   'Detailed measurements, body composition and interpretation.',
   45, 600.00, false, 3);

delete from questionnaire_questions;
insert into questionnaire_questions (question_es, question_en, field_type, is_required, sort_order) values
  ('¿Qué deporte practicas y con qué frecuencia?','What sport do you practice and how often?','textarea',true,1),
  ('¿Cuáles son tus objetivos principales?','What are your main goals?','textarea',true,2),
  ('¿Tienes alergias o intolerancias alimentarias?','Any food allergies or intolerances?','textarea',false,3),
  ('¿Tomas algún medicamento o suplemento actualmente?','Currently taking any medication or supplements?','textarea',false,4),
  ('¿Tienes alguna condición médica relevante?','Any relevant medical condition?','textarea',false,5),
  ('¿Cuántas horas duermes en promedio?','Average hours of sleep?','number',false,6);

-- Identity / terminology
insert into settings (key, value) values
  ('brand_profession_es', '"Nutrióloga deportiva"'::jsonb),
  ('brand_profession_en', '"Sports nutritionist"'::jsonb),
  ('hero_eyebrow_es', '"Nutrición deportiva"'::jsonb),
  ('hero_eyebrow_en', '"Sports nutrition"'::jsonb),
  ('hero_title_es', '"Optimiza tu nutrición para rendir más y recuperarte mejor"'::jsonb),
  ('hero_title_en', '"Fuel smarter, perform harder, recover faster"'::jsonb),
  ('hero_subtitle_es', '"Asesoría profesional para deportistas y personas activas. Planes personalizados basados en evidencia."'::jsonb),
  ('hero_subtitle_en', '"Professional guidance for athletes and active people. Evidence-based personalized plans."'::jsonb),
  ('term_patient_es', '"Paciente"'::jsonb),
  ('term_patient_en', '"Patient"'::jsonb),
  ('term_patient_plural_es', '"Pacientes"'::jsonb),
  ('term_patient_plural_en', '"Patients"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

commit;
