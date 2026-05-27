import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

export type BookingConfirmationPatientProps = {
  locale: "es" | "en";
  patientName: string;
  appointmentTypeName: string;
  formattedDate: string; // already in MX TZ + locale
  formattedTime: string;
  modality: "in_person" | "virtual";
  meetLink?: string | null;
  manageUrl: string;
  cancellationPolicy: string;
  brandName?: string;
};

const COPY = {
  es: {
    preview: "Tu cita está confirmada",
    greeting: "¡Hola",
    confirmed: "Tu cita está confirmada",
    details: "Detalles",
    type: "Tipo",
    date: "Fecha",
    time: "Hora",
    modality: "Modalidad",
    inPerson: "Presencial",
    virtual: "Virtual",
    meetLink: "Enlace de la sesión",
    manage: "Gestionar mi cita",
    manageBody:
      "Puedes ver detalles, descargar el archivo de calendario, cancelar o reagendar desde este enlace:",
    policy: "Política",
    signoff: "Te veo pronto,",
  },
  en: {
    preview: "Your appointment is confirmed",
    greeting: "Hi",
    confirmed: "Your appointment is confirmed",
    details: "Details",
    type: "Type",
    date: "Date",
    time: "Time",
    modality: "Modality",
    inPerson: "In person",
    virtual: "Virtual",
    meetLink: "Session link",
    manage: "Manage my appointment",
    manageBody:
      "You can view details, download the calendar file, cancel or reschedule from this link:",
    policy: "Policy",
    signoff: "See you soon,",
  },
};

export function BookingConfirmationPatient(
  props: BookingConfirmationPatientProps,
) {
  const t = COPY[props.locale];
  const brand = props.brandName ?? "Mi Clínica";
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f7f2",
          fontFamily:
            "Montserrat, -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#2a2a2a",
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 32,
            maxWidth: 560,
          }}
        >
          <Section>
            <Heading
              as="h1"
              style={{ fontSize: 22, margin: 0, color: "#2a2a2a" }}
            >
              {t.confirmed}
            </Heading>
            <Text>
              {t.greeting} {props.patientName},
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: "#dbe6bc",
              borderRadius: 16,
              padding: 20,
              marginTop: 12,
            }}
          >
            <Text style={{ margin: 0, fontWeight: 600 }}>{t.details}</Text>
            <Row label={t.type} value={props.appointmentTypeName} />
            <Row label={t.date} value={props.formattedDate} />
            <Row label={t.time} value={props.formattedTime} />
            <Row
              label={t.modality}
              value={
                props.modality === "in_person" ? t.inPerson : t.virtual
              }
            />
            {props.meetLink && (
              <Row
                label={t.meetLink}
                value={
                  <Link
                    href={props.meetLink}
                    style={{ color: "#eb3f66", wordBreak: "break-all" }}
                  >
                    {props.meetLink}
                  </Link>
                }
              />
            )}
          </Section>

          <Section style={{ marginTop: 24 }}>
            <Text style={{ marginBottom: 8 }}>{t.manageBody}</Text>
            <Link
              href={props.manageUrl}
              style={{
                display: "inline-block",
                backgroundColor: "#a8c658",
                color: "#2a2a2a",
                padding: "12px 22px",
                borderRadius: 14,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              {t.manage}
            </Link>
          </Section>

          <Hr style={{ margin: "28px 0", borderColor: "#eee" }} />

          <Section>
            <Text style={{ fontSize: 12, color: "#6b6b6b", margin: 0 }}>
              <strong>{t.policy}:</strong> {props.cancellationPolicy}
            </Text>
            <Text style={{ marginTop: 18 }}>
              {t.signoff}
              <br />
              <strong>{brand}</strong>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Text style={{ margin: "8px 0 0 0", fontSize: 14 }}>
      <span style={{ color: "#6b6b6b" }}>{label}: </span>
      <strong>{value}</strong>
    </Text>
  );
}

export default BookingConfirmationPatient;
