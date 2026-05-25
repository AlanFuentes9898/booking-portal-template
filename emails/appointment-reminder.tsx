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

export type AppointmentReminderProps = {
  locale: "es" | "en";
  patientName: string;
  appointmentTypeName: string;
  formattedDate: string;
  formattedTime: string;
  modality: "in_person" | "virtual";
  meetLink?: string | null;
  manageUrl: string;
  brandName?: string;
  /** Short city label shown next to the time, e.g. "CDMX", "Morelia". */
  officeCity?: string;
};

const COPY = {
  es: {
    preview: "Recordatorio: tu cita es mañana",
    title: "Tu cita es mañana",
    greeting: "Hola",
    body: "Te recordamos que mañana tienes consulta agendada.",
    details: "Detalles",
    type: "Tipo",
    date: "Fecha",
    time: "Hora",
    modality: "Modalidad",
    inPerson: "Presencial",
    virtual: "Virtual (Google Meet)",
    meetLink: "Enlace Meet",
    tips: "Antes de tu sesión:",
    tip1: "Ten a la mano tus estudios recientes (si aplica).",
    tip2: "Apunta tus preguntas sobre alimentación y rendimiento.",
    tip3: "Si necesitas cancelar o reagendar, hazlo desde el enlace abajo.",
    cta: "Gestionar mi cita",
    signoff: "Nos vemos pronto,",
  },
  en: {
    preview: "Reminder: your appointment is tomorrow",
    title: "Your appointment is tomorrow",
    greeting: "Hi",
    body: "Friendly reminder that you have a consultation booked for tomorrow.",
    details: "Details",
    type: "Type",
    date: "Date",
    time: "Time",
    modality: "Modality",
    inPerson: "In person",
    virtual: "Virtual (Google Meet)",
    meetLink: "Meet link",
    tips: "Before your session:",
    tip1: "Have your recent test results handy (if applicable).",
    tip2: "Note your questions about nutrition and performance.",
    tip3: "If you need to cancel or reschedule, use the link below.",
    cta: "Manage my appointment",
    signoff: "See you soon,",
  },
};

export function AppointmentReminderEmail(props: AppointmentReminderProps) {
  const t = COPY[props.locale];
  const brand = props.brandName ?? "Mi Clínica";
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f7f2",
          fontFamily: "Montserrat, -apple-system, BlinkMacSystemFont, sans-serif",
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
            <div
              style={{
                display: "inline-block",
                padding: "6px 14px",
                borderRadius: 999,
                backgroundColor: "#ffabc1",
                color: "#eb3f66",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Recordatorio
            </div>
            <Heading
              as="h1"
              style={{ fontSize: 22, margin: "12px 0 0 0", color: "#2a2a2a" }}
            >
              {t.title}
            </Heading>
            <Text style={{ marginTop: 12 }}>
              {t.greeting} {props.patientName}, {t.body.toLowerCase()}
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: "#dbe6bc",
              borderRadius: 16,
              padding: 20,
              marginTop: 16,
            }}
          >
            <Text style={{ margin: 0, fontWeight: 600 }}>{t.details}</Text>
            <Row label={t.type} value={props.appointmentTypeName} />
            <Row label={t.date} value={props.formattedDate} />
            <Row
              label={t.time}
              value={`${props.formattedTime} (${props.officeCity ?? "CDMX"})`}
            />
            <Row
              label={t.modality}
              value={props.modality === "in_person" ? t.inPerson : t.virtual}
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
            <Text style={{ margin: "0 0 8px 0", fontWeight: 600 }}>{t.tips}</Text>
            <Text style={{ margin: 0, color: "#6b6b6b", fontSize: 14 }}>
              • {t.tip1}
              <br />• {t.tip2}
              <br />• {t.tip3}
            </Text>
          </Section>

          <Section style={{ marginTop: 24 }}>
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
              {t.cta}
            </Link>
          </Section>

          <Hr style={{ margin: "28px 0 16px 0", borderColor: "#eee" }} />

          <Text style={{ fontSize: 13, color: "#6b6b6b", margin: 0 }}>
            {t.signoff}
            <br />
            <strong style={{ color: "#2a2a2a" }}>{brand}</strong>
          </Text>
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

export default AppointmentReminderEmail;
