import { Button } from "@/components/ui/button";
import { getSettings } from "@/lib/settings";
import { savePublicProfile } from "./actions";

export const dynamic = "force-dynamic";

export default async function PerfilPublicoPage() {
  const s = await getSettings();

  return (
    <form action={savePublicProfile} className="space-y-6">
      <Section
        title="Identidad"
        description="Nombre del negocio y profesión. El nombre del header proviene de NEXT_PUBLIC_BRAND_NAME por default si lo dejas vacío."
      >
        <Grid2>
          <Field label="Nombre del negocio">
            <input
              name="brand_name"
              defaultValue={s.brand_name}
              maxLength={80}
              placeholder="(usa el valor del .env si está vacío)"
              className="form-input"
            />
          </Field>
          <Field label="Nombre corto (header / sidebar)">
            <input
              name="brand_short_name"
              defaultValue={s.brand_short_name}
              maxLength={60}
              placeholder="(usa el valor del .env si está vacío)"
              className="form-input"
            />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="Profesión (ES)">
            <input
              name="brand_profession_es"
              defaultValue={s.brand_profession_es}
              maxLength={80}
              placeholder="Ej: Nutrióloga deportiva, Psicólogo clínico"
              className="form-input"
            />
          </Field>
          <Field label="Profession (EN)">
            <input
              name="brand_profession_en"
              defaultValue={s.brand_profession_en}
              maxLength={80}
              placeholder="E.g. Sports Nutritionist, Clinical Psychologist"
              className="form-input"
            />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="Tagline (ES)">
            <input
              name="brand_tagline_es"
              defaultValue={s.brand_tagline_es}
              maxLength={160}
              placeholder="Aparece en el footer"
              className="form-input"
            />
          </Field>
          <Field label="Tagline (EN)">
            <input
              name="brand_tagline_en"
              defaultValue={s.brand_tagline_en}
              maxLength={160}
              className="form-input"
            />
          </Field>
        </Grid2>
      </Section>

      <Section
        title="Hero del sitio"
        description="Copy de la sección principal del landing. Deja vacío para usar el texto genérico de las traducciones."
      >
        <Grid2>
          <Field label="Eyebrow (ES)">
            <input
              name="hero_eyebrow_es"
              defaultValue={s.hero_eyebrow_es}
              maxLength={80}
              placeholder="Ej: Nutrición deportiva"
              className="form-input"
            />
          </Field>
          <Field label="Eyebrow (EN)">
            <input
              name="hero_eyebrow_en"
              defaultValue={s.hero_eyebrow_en}
              maxLength={80}
              className="form-input"
            />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="Título (ES)">
            <input
              name="hero_title_es"
              defaultValue={s.hero_title_es}
              maxLength={160}
              className="form-input"
            />
          </Field>
          <Field label="Title (EN)">
            <input
              name="hero_title_en"
              defaultValue={s.hero_title_en}
              maxLength={160}
              className="form-input"
            />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="Subtítulo (ES)">
            <textarea
              name="hero_subtitle_es"
              defaultValue={s.hero_subtitle_es}
              rows={2}
              maxLength={320}
              className="form-input"
            />
          </Field>
          <Field label="Subtitle (EN)">
            <textarea
              name="hero_subtitle_en"
              defaultValue={s.hero_subtitle_en}
              rows={2}
              maxLength={320}
              className="form-input"
            />
          </Field>
        </Grid2>
      </Section>

      <Section
        title="Terminología"
        description="Cómo te refieres a tus pacientes/clientes. Útil para psicólogos (consultantes), coaches (clientes), etc."
      >
        <Grid2>
          <Field label="Singular (ES)">
            <input
              name="term_patient_es"
              defaultValue={s.term_patient_es}
              maxLength={40}
              placeholder="Paciente"
              className="form-input"
            />
          </Field>
          <Field label="Singular (EN)">
            <input
              name="term_patient_en"
              defaultValue={s.term_patient_en}
              maxLength={40}
              placeholder="Patient"
              className="form-input"
            />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="Plural (ES)">
            <input
              name="term_patient_plural_es"
              defaultValue={s.term_patient_plural_es}
              maxLength={40}
              placeholder="Pacientes"
              className="form-input"
            />
          </Field>
          <Field label="Plural (EN)">
            <input
              name="term_patient_plural_en"
              defaultValue={s.term_patient_plural_en}
              maxLength={40}
              placeholder="Patients"
              className="form-input"
            />
          </Field>
        </Grid2>
      </Section>

      <Section
        title="Sobre mí (bio)"
        description="Aparece en la sección 'Sobre' del landing y en la página /sobre."
      >
        <Field label="Bio (ES)">
          <textarea
            name="bio_es"
            defaultValue={s.bio_es}
            rows={5}
            className="form-input"
            placeholder="Cuenta tu trayectoria, formación, enfoque..."
          />
        </Field>
        <Field label="Bio (EN)">
          <textarea
            name="bio_en"
            defaultValue={s.bio_en}
            rows={5}
            className="form-input"
            placeholder="Tell about your background, training, approach..."
          />
        </Field>
      </Section>

      <Section
        title="Datos públicos de contacto"
        description="Visibles en /contacto. Déjalos vacíos para ocultarlos."
      >
        <Grid2>
          <Field label="Email público">
            <input
              type="email"
              name="public_email"
              defaultValue={s.public_email}
              placeholder="contacto@miclinica.com"
              className="form-input"
            />
          </Field>
          <Field label="Teléfono público">
            <input
              type="tel"
              name="public_phone"
              defaultValue={s.public_phone}
              placeholder="+52 55 ..."
              className="form-input"
            />
          </Field>
        </Grid2>
        <Field label="Dirección del consultorio">
          <textarea
            name="public_address"
            defaultValue={s.public_address}
            rows={2}
            className="form-input"
            placeholder="Calle, número, colonia, CDMX"
          />
        </Field>
      </Section>

      <Section
        title="Redes sociales"
        description="Links que aparecen en footer y /contacto."
      >
        <Field label="Handle de Instagram (sin @)">
          <input
            name="social_instagram_handle"
            defaultValue={s.social_instagram_handle.replace(/^@/, "")}
            placeholder="mi.clinica"
            className="form-input"
          />
        </Field>
        <Grid2>
          <Field label="URL Instagram">
            <input
              type="url"
              name="social_instagram_url"
              defaultValue={s.social_instagram_url}
              placeholder="https://www.instagram.com/..."
              className="form-input"
            />
          </Field>
          <Field label="URL Facebook">
            <input
              type="url"
              name="social_facebook_url"
              defaultValue={s.social_facebook_url}
              placeholder="https://www.facebook.com/..."
              className="form-input"
            />
          </Field>
        </Grid2>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Guardar perfil
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
      `}</style>
    </form>
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

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider font-semibold text-[color:var(--color-brand-muted)] mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
