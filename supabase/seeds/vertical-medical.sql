-- =====================================================
-- Vertical preset: General medicine / family doctor
-- =====================================================
begin;

delete from appointment_types;
insert into appointment_types
  (name_es, name_en, description_es, description_en, duration_minutes, price_mxn, is_for_new_patients, sort_order)
values
  ('Consulta general', 'General consultation',
   'Evaluación clínica integral, diagnóstico y plan de tratamiento.',
   'Comprehensive clinical assessment, diagnosis and treatment plan.',
   40, 700.00, true, 1),
  ('Consulta de seguimiento', 'Follow-up consultation',
   'Revisión, ajuste de tratamiento y resultados de estudios.',
   'Follow-up, treatment adjustments and test results.',
   25, 500.00, false, 2),
  ('Chequeo preventivo', 'Preventive check-up',
   'Evaluación anual con historia clínica y exploración física.',
   'Annual evaluation with medical history and physical exam.',
   45, 900.00, false, 3);

delete from questionnaire_questions;
insert into questionnaire_questions (question_es, question_en, field_type, is_required, sort_order) values
  ('¿Cuál es el motivo principal de tu visita?','What is the main reason for your visit?','textarea',true,1),
  ('¿Tienes alguna enfermedad crónica diagnosticada?','Any diagnosed chronic illness?','textarea',false,2),
  ('¿Tomas algún medicamento de forma regular? (incluye dosis)','Currently on any regular medication? (include doses)','textarea',false,3),
  ('¿Alergias conocidas a medicamentos o alimentos?','Known allergies to drugs or foods?','textarea',false,4),
  ('¿Antecedentes familiares relevantes?','Relevant family medical history?','textarea',false,5),
  ('¿Cirugías u hospitalizaciones previas?','Previous surgeries or hospitalizations?','textarea',false,6);

insert into settings (key, value) values
  ('brand_profession_es', '"Médico general"'::jsonb),
  ('brand_profession_en', '"General practitioner"'::jsonb),
  ('hero_eyebrow_es', '"Atención médica"'::jsonb),
  ('hero_eyebrow_en', '"Medical care"'::jsonb),
  ('hero_title_es', '"Atención médica cercana, profesional y personalizada"'::jsonb),
  ('hero_title_en', '"Personal, professional, close medical care"'::jsonb),
  ('hero_subtitle_es', '"Consulta general con enfoque integral y preventivo. Atención presencial y telemedicina."'::jsonb),
  ('hero_subtitle_en', '"General practice with a comprehensive, preventive approach. In-person and telemedicine."'::jsonb),
  ('term_patient_es', '"Paciente"'::jsonb),
  ('term_patient_en', '"Patient"'::jsonb),
  ('term_patient_plural_es', '"Pacientes"'::jsonb),
  ('term_patient_plural_en', '"Patients"'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

commit;
