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

export type BookingNotificationAdminProps = {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  patientSport?: string | null;
  isNew: boolean;
  appointmentTypeName: string;
  formattedDate: string;
  formattedTime: string;
  modality: "in_person" | "virtual";
  patientReason?: string | null;
};

export function BookingNotificationAdmin(props: BookingNotificationAdminProps) {
  return (
    <Html>
      <Head />
      <Preview>Nueva cita: {props.patientName}</Preview>
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
            Nueva cita {props.isNew ? "🆕" : ""}
          </Heading>

          <Section
            style={{
              marginTop: 16,
              backgroundColor: "#dbe6bc",
              borderRadius: 16,
              padding: 18,
            }}
          >
            <Text style={{ margin: 0, fontWeight: 600 }}>Paciente</Text>
            <Text style={{ margin: "6px 0 0" }}>
              {props.patientName}
              {props.isNew ? " (nuevo)" : ""}
            </Text>
            <Text style={{ margin: 0, fontSize: 14, color: "#6b6b6b" }}>
              {props.patientEmail} · {props.patientPhone}
              {props.patientSport ? ` · ${props.patientSport}` : ""}
            </Text>
          </Section>

          <Section style={{ marginTop: 16 }}>
            <Text style={{ margin: 0 }}>
              <strong>{props.appointmentTypeName}</strong> ·{" "}
              {props.modality === "in_person" ? "Presencial" : "Virtual"}
            </Text>
            <Text style={{ margin: "4px 0 0" }}>
              {props.formattedDate} · {props.formattedTime}
            </Text>
          </Section>

          {props.patientReason && (
            <Section style={{ marginTop: 16 }}>
              <Text style={{ margin: 0, fontSize: 13, color: "#6b6b6b" }}>
                Motivo:
              </Text>
              <Text style={{ margin: 0, fontSize: 14 }}>
                {props.patientReason}
              </Text>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
}

export default BookingNotificationAdmin;
