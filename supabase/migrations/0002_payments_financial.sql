-- ============================================================
-- 0002_payments_financial.sql
-- Adds two columns needed to fully track manual payments per
-- appointment, plus the supporting settings rows for the
-- financial module (configurable payment methods + currency).
-- ============================================================

-- Columns: who/when of the payment. payment_status, amount_paid
-- and payment_intent_id already exist from 0001_init.sql.
alter table appointments
  add column if not exists payment_method text,
  add column if not exists paid_at timestamptz;

create index if not exists idx_appointments_payment_status
  on appointments (payment_status);
create index if not exists idx_appointments_paid_at
  on appointments (paid_at);

-- Settings used by the financial module.
-- payment_methods is a list each client edits from /admin/configuracion/pagos.
-- currency_code lets the UI render the right symbol (defaults to MXN to match
-- the existing seed prices in appointment_types).
insert into settings (key, value) values
  ('payment_methods', '["Efectivo","Transferencia","Tarjeta"]'::jsonb),
  ('currency_code', '"MXN"'::jsonb)
on conflict (key) do nothing;
