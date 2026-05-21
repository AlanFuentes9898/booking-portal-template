-- =====================================================
-- Vertical preset: Generic / catch-all
-- Use when no specific vertical fits. Plain copy that
-- the admin can customize from the dashboard.
-- =====================================================
begin;

delete from appointment_types;
insert into appointment_types
  (name_es, name_en, description_es, description_en, duration_minutes, price_mxn, is_for_new_patients, sort_order)
values
  ('Consulta', 'Consultation',
   'Sesión profesional con plan personalizado.',
   'Professional session with personalized plan.',
   60, 500.00, true, 1),
  ('Seguimiento', 'Follow-up',
   'Sesión de continuidad.',
   'Continuation session.',
   30, 300.00, false, 2);

delete from questionnaire_questions;
insert into questionnaire_questions (question_es, question_en, field_type, is_required, sort_order) values
  ('¿Cuál es el motivo de tu consulta?','What is the reason for your visit?','textarea',true,1),
  ('¿Algo relevante que debamos saber antes de la sesión?','Anything relevant we should know beforehand?','textarea',false,2);

-- Identity intentionally left empty — admin will fill via /admin/configuracion/perfil
commit;
