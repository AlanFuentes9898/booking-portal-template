"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldGrid } from "@/components/ui/field";
import { SettingsForm } from "@/components/admin/settings-form";
import { savePublicProfile } from "./actions";
import type { AppSettings } from "@/lib/settings";

export function PerfilForm({ settings: s }: { settings: AppSettings }) {
  return (
    <SettingsForm
      action={savePublicProfile}
      successMessage="Perfil público guardado"
      className="space-y-6"
    >
      {(state, pending) => {
        const e = state.fieldErrors ?? {};
        return (
          <>
            <Section
              title="Identidad"
              description="Nombre del negocio y profesión. Si dejas estos campos vacíos, se usará un valor predeterminado del sistema."
            >
              <FieldGrid>
                <Field
                  label="Nombre del negocio"
                  help="Nombre largo que aparece en pestañas del navegador y emails. Ej: 'Mari Carmen — Nutrición'."
                  maxLength={80}
                  defaultValue={s.brand_name}
                  error={e.brand_name}
                >
                  <input
                    name="brand_name"
                    defaultValue={s.brand_name}
                    maxLength={80}
                    placeholder="Déjalo vacío para usar el predeterminado"
                    className="form-input"
                  />
                </Field>
                <Field
                  label="Nombre corto (header / sidebar)"
                  help="Versión compacta que cabe en el header y el sidebar admin. Ej: 'Mari Carmen'."
                  maxLength={60}
                  defaultValue={s.brand_short_name}
                  error={e.brand_short_name}
                >
                  <input
                    name="brand_short_name"
                    defaultValue={s.brand_short_name}
                    maxLength={60}
                    placeholder="Déjalo vacío para usar el predeterminado"
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
              <FieldGrid>
                <Field
                  label="Profesión (ES)"
                  help="Cómo te identificas profesionalmente. Aparece debajo de tu nombre en el header del sitio."
                  maxLength={80}
                  defaultValue={s.brand_profession_es}
                  error={e.brand_profession_es}
                >
                  <input
                    name="brand_profession_es"
                    defaultValue={s.brand_profession_es}
                    maxLength={80}
                    placeholder="Ej: Nutrióloga deportiva, Psicólogo clínico"
                    className="form-input"
                  />
                </Field>
                <Field
                  label="Profession (EN)"
                  help="English version of your professional title."
                  maxLength={80}
                  defaultValue={s.brand_profession_en}
                  error={e.brand_profession_en}
                >
                  <input
                    name="brand_profession_en"
                    defaultValue={s.brand_profession_en}
                    maxLength={80}
                    placeholder="E.g. Sports Nutritionist, Clinical Psychologist"
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
              <FieldGrid>
                <Field
                  label="Tagline (ES)"
                  help="Frase corta de presentación que aparece en el footer del sitio. Ej: 'Acompañándote a alcanzar tu mejor versión'."
                  maxLength={160}
                  defaultValue={s.brand_tagline_es}
                  error={e.brand_tagline_es}
                >
                  <input
                    name="brand_tagline_es"
                    defaultValue={s.brand_tagline_es}
                    maxLength={160}
                    placeholder="Aparece en el footer"
                    className="form-input"
                  />
                </Field>
                <Field
                  label="Tagline (EN)"
                  help="Short tagline shown in the site footer."
                  maxLength={160}
                  defaultValue={s.brand_tagline_en}
                  error={e.brand_tagline_en}
                >
                  <input
                    name="brand_tagline_en"
                    defaultValue={s.brand_tagline_en}
                    maxLength={160}
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
            </Section>

            <Section
              title="Hero del sitio"
              description="Copy de la sección principal del landing (lo primero que ve el visitante). Deja vacío para usar el texto genérico."
            >
              <FieldGrid>
                <Field
                  label="Eyebrow (ES)"
                  help="Texto chico que aparece arriba del título grande del landing. Sirve como categoría o pre-título. Ej: 'Nutrición deportiva', 'Pediatría'."
                  maxLength={80}
                  defaultValue={s.hero_eyebrow_es}
                  error={e.hero_eyebrow_es}
                >
                  <input
                    name="hero_eyebrow_es"
                    defaultValue={s.hero_eyebrow_es}
                    maxLength={80}
                    placeholder="Ej: Nutrición deportiva"
                    className="form-input"
                  />
                </Field>
                <Field
                  label="Eyebrow (EN)"
                  help="Small text that appears above the hero title on the landing. Acts as a category or pre-title."
                  maxLength={80}
                  defaultValue={s.hero_eyebrow_en}
                  error={e.hero_eyebrow_en}
                >
                  <input
                    name="hero_eyebrow_en"
                    defaultValue={s.hero_eyebrow_en}
                    maxLength={80}
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
              <FieldGrid>
                <Field
                  label="Título (ES)"
                  help="Frase principal en grande del landing. Lo primero que se lee al entrar al sitio."
                  maxLength={160}
                  defaultValue={s.hero_title_es}
                  error={e.hero_title_es}
                >
                  <input
                    name="hero_title_es"
                    defaultValue={s.hero_title_es}
                    maxLength={160}
                    className="form-input"
                  />
                </Field>
                <Field
                  label="Title (EN)"
                  help="Main hero headline. The first thing visitors read."
                  maxLength={160}
                  defaultValue={s.hero_title_en}
                  error={e.hero_title_en}
                >
                  <input
                    name="hero_title_en"
                    defaultValue={s.hero_title_en}
                    maxLength={160}
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
              <FieldGrid>
                <Field
                  label="Subtítulo (ES)"
                  help="Párrafo corto debajo del título que explica brevemente tu propuesta."
                  maxLength={320}
                  defaultValue={s.hero_subtitle_es}
                  error={e.hero_subtitle_es}
                >
                  <textarea
                    name="hero_subtitle_es"
                    defaultValue={s.hero_subtitle_es}
                    rows={2}
                    maxLength={320}
                    className="form-input"
                  />
                </Field>
                <Field
                  label="Subtitle (EN)"
                  help="Short paragraph under the title that briefly explains your offer."
                  maxLength={320}
                  defaultValue={s.hero_subtitle_en}
                  error={e.hero_subtitle_en}
                >
                  <textarea
                    name="hero_subtitle_en"
                    defaultValue={s.hero_subtitle_en}
                    rows={2}
                    maxLength={320}
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
            </Section>

            <Section
              title="Terminología"
              description="Cómo te refieres a las personas que atiendes. Útil para psicólogos ('consultante'), coaches ('cliente'), etc."
            >
              <FieldGrid>
                <Field
                  label="Singular (ES)"
                  help="Singular en español. Se usa en mensajes del sistema y emails. Ej: 'paciente', 'cliente', 'consultante'."
                  maxLength={40}
                  defaultValue={s.term_patient_es}
                  error={e.term_patient_es}
                >
                  <input
                    name="term_patient_es"
                    defaultValue={s.term_patient_es}
                    maxLength={40}
                    placeholder="Paciente"
                    className="form-input"
                  />
                </Field>
                <Field
                  label="Singular (EN)"
                  help="English singular term. Used across system messages."
                  maxLength={40}
                  defaultValue={s.term_patient_en}
                  error={e.term_patient_en}
                >
                  <input
                    name="term_patient_en"
                    defaultValue={s.term_patient_en}
                    maxLength={40}
                    placeholder="Patient"
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
              <FieldGrid>
                <Field
                  label="Plural (ES)"
                  help="Plural en español. Ej: 'pacientes', 'clientes', 'consultantes'."
                  maxLength={40}
                  defaultValue={s.term_patient_plural_es}
                  error={e.term_patient_plural_es}
                >
                  <input
                    name="term_patient_plural_es"
                    defaultValue={s.term_patient_plural_es}
                    maxLength={40}
                    placeholder="Pacientes"
                    className="form-input"
                  />
                </Field>
                <Field
                  label="Plural (EN)"
                  help="English plural form."
                  maxLength={40}
                  defaultValue={s.term_patient_plural_en}
                  error={e.term_patient_plural_en}
                >
                  <input
                    name="term_patient_plural_en"
                    defaultValue={s.term_patient_plural_en}
                    maxLength={40}
                    placeholder="Patients"
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
            </Section>

            <Section
              title="Sobre mí (bio)"
              description="Aparece en la sección 'Sobre' del landing y en la página /sobre. Hasta 4,000 caracteres."
            >
              <Field
                label="Bio (ES)"
                help="Cuenta tu trayectoria, formación y enfoque. Soporta varios párrafos."
                maxLength={4000}
                defaultValue={s.bio_es}
                error={e.bio_es}
              >
                <textarea
                  name="bio_es"
                  defaultValue={s.bio_es}
                  rows={6}
                  maxLength={4000}
                  className="form-input"
                  placeholder="Cuenta tu trayectoria, formación, enfoque..."
                />
              </Field>
              <Field
                label="Bio (EN)"
                help="Tell about your background, training and approach."
                maxLength={4000}
                defaultValue={s.bio_en}
                error={e.bio_en}
              >
                <textarea
                  name="bio_en"
                  defaultValue={s.bio_en}
                  rows={6}
                  maxLength={4000}
                  className="form-input"
                  placeholder="Tell about your background, training, approach..."
                />
              </Field>
            </Section>

            <Section
              title="Datos públicos de contacto"
              description="Visibles en /contacto. Déjalos vacíos para ocultarlos."
            >
              <FieldGrid>
                <Field
                  label="Email público"
                  help="Email que se muestra en la página de contacto. Puede ser distinto al de tu cuenta admin."
                  error={e.public_email}
                >
                  <input
                    type="email"
                    name="public_email"
                    defaultValue={s.public_email}
                    placeholder="contacto@miclinica.com"
                    className="form-input"
                  />
                </Field>
                <Field
                  label="Teléfono público"
                  help="Teléfono mostrado en contacto. Si activas WhatsApp, también es el destino del botón 'WhatsApp'."
                  maxLength={40}
                  defaultValue={s.public_phone}
                  error={e.public_phone}
                >
                  <input
                    type="tel"
                    name="public_phone"
                    defaultValue={s.public_phone}
                    maxLength={40}
                    placeholder="+52 55 ..."
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
              <FieldGrid>
                <Field
                  label="Dirección del consultorio"
                  help="Dirección completa. Se muestra en /contacto si la atención es presencial. Déjala vacía si solo atiendes virtualmente."
                  maxLength={400}
                  defaultValue={s.public_address}
                  error={e.public_address}
                >
                  <textarea
                    name="public_address"
                    defaultValue={s.public_address}
                    rows={2}
                    maxLength={400}
                    className="form-input"
                    placeholder="Calle, número, colonia, ciudad"
                  />
                </Field>
                <Field
                  label="Ciudad del consultorio"
                  help="Nombre corto de la ciudad. Aparece en el flujo de reserva ('Consultorio en Morelia') y al lado de los horarios en emails y vistas admin (ej: '10:00 (Morelia)')."
                  maxLength={40}
                  defaultValue={s.office_city}
                  error={e.office_city}
                >
                  <input
                    name="office_city"
                    defaultValue={s.office_city}
                    maxLength={40}
                    placeholder="Ej: Morelia"
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
            </Section>

            <Section
              title="Redes sociales"
              description="Links que aparecen en footer y /contacto."
            >
              <Field
                label="Handle de Instagram (sin @)"
                help="Tu nombre de usuario en Instagram, sin el símbolo @. Ej: 'mari.carmen.nutricion'."
                maxLength={60}
                defaultValue={s.social_instagram_handle.replace(/^@/, "")}
                error={e.social_instagram_handle}
              >
                <input
                  name="social_instagram_handle"
                  defaultValue={s.social_instagram_handle.replace(/^@/, "")}
                  maxLength={60}
                  placeholder="mi.clinica"
                  className="form-input"
                />
              </Field>
              <FieldGrid>
                <Field
                  label="URL Instagram"
                  help="Link completo a tu perfil. Debe empezar con https://"
                  error={e.social_instagram_url}
                >
                  <input
                    type="url"
                    name="social_instagram_url"
                    defaultValue={s.social_instagram_url}
                    placeholder="https://www.instagram.com/..."
                    className="form-input"
                  />
                </Field>
                <Field
                  label="URL Facebook"
                  help="Link completo a tu página. Debe empezar con https://"
                  error={e.social_facebook_url}
                >
                  <input
                    type="url"
                    name="social_facebook_url"
                    defaultValue={s.social_facebook_url}
                    placeholder="https://www.facebook.com/..."
                    className="form-input"
                  />
                </Field>
              </FieldGrid>
            </Section>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={pending}>
                {pending ? "Guardando..." : "Guardar perfil"}
              </Button>
            </div>

            <style>{`
              .form-input {
                width: 100%;
                padding: 11px 14px;
                border-radius: 12px;
                border: 1px solid rgba(42,42,42,0.15);
                background: white;
                font-size: 14px;
                outline: none;
                transition: border-color .15s, box-shadow .15s;
              }
              .form-input:focus {
                border-color: var(--color-brand-green);
                box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-green) 28%, transparent);
              }
              .form-input[aria-invalid="true"] {
                border-color: var(--color-brand-pink);
                box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-brand-pink) 25%, transparent);
              }
            `}</style>
          </>
        );
      }}
    </SettingsForm>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white border border-[color:var(--color-brand-ink)]/8 p-6">
      <header className="mb-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="text-xs text-[color:var(--color-brand-muted)] mt-1">
            {description}
          </p>
        )}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
