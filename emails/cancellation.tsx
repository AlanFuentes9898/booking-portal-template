import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type CancellationEmailProps = {
  locale: "es" | "en";
  recipientType: "patient" | "admin";
  patientName: string;
  appointmentTypeName: string;
  formattedDate: string;
  formattedTime: string;
};

const COPY = {
  es: {
    preview: "Cita cancelada",
    titlePatient: "Tu cita fue cancelada",
    titleAdmin: "Cita cancelada por el paciente",
    body: "Esperamos verte pronto. Puedes agendar de nuevo cuando quieras.",
  },
  en: {
    preview: "Appointment cancelled",
    titlePatient: "Your appointment was cancelled",
    titleAdmin: "Appointment cancelled by patient",
    body: "Hope to see you soon. You can book again anytime.",
  },
};

export function CancellationEmail(props: CancellationEmailProps) {
  const t = COPY[props.locale];
  const title =
    props.recipientType === "patient" ? t.titlePatient : t.titleAdmin;
  return (
    <Html>
      <Head />
      <Preview>{t.preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f7f2",
          fontFamily: "Montserrat, sans-serif",
          color: "#2a2a2a",
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 24,
            padding: 28,
            maxWidth: 560,
          }}
        >
          <Heading as="h1" style={{ fontSize: 20, margin: 0 }}>
            {title}
          </Heading>
          <Section style={{ marginTop: 12 }}>
            <Text>{props.patientName}</Text>
            <Text>
              <strong>{props.appointmentTypeName}</strong>
            </Text>
            <Text>
              {props.formattedDate} · {props.formattedTime}
            </Text>
            <Text style={{ marginTop: 16, color: "#6b6b6b" }}>{t.body}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default CancellationEmail;
