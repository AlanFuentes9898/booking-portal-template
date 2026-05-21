import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

export type DailySummaryItem = {
  time: string;
  patientName: string;
  patientPhone: string;
  typeName: string;
  modality: "in_person" | "virtual";
  isNew: boolean;
  meetLink?: string | null;
};

export type DailySummaryAdminProps = {
  formattedDate: string;
  items: DailySummaryItem[];
  brandName?: string;
};

export function DailySummaryAdminEmail(props: DailySummaryAdminProps) {
  const count = props.items.length;
  return (
    <Html>
      <Head />
      <Preview>
        {count === 0
          ? "Hoy no tienes citas"
          : `${count} ${count === 1 ? "cita" : "citas"} para hoy`}
      </Preview>
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
            padding: 32,
            maxWidth: 620,
          }}
        >
          <Section>
            <div
              style={{
                display: "inline-block",
                padding: "5px 12px",
                borderRadius: 999,
                backgroundColor: "#dbe6bc",
                color: "#2a2a2a",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1.5,
                textTransform: "uppercase",
              }}
            >
              Resumen diario
            </div>
            <Heading as="h1" style={{ fontSize: 22, margin: "12px 0 4px 0" }}>
              {props.formattedDate}
            </Heading>
            <Text style={{ margin: 0, color: "#6b6b6b" }}>
              {count === 0
                ? "Hoy no tienes citas agendadas."
                : `Tienes ${count} ${count === 1 ? "cita" : "citas"} hoy.`}
            </Text>
          </Section>

          {count > 0 && (
            <Section style={{ marginTop: 20 }}>
              <table
                cellPadding={0}
                cellSpacing={0}
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1px solid #eee",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#f4f7eb" }}>
                    <Th>Hora</Th>
                    <Th>Paciente</Th>
                    <Th>Tipo</Th>
                    <Th>Modalidad</Th>
                  </tr>
                </thead>
                <tbody>
                  {props.items.map((it, i) => (
                    <tr
                      key={i}
                      style={{ borderTop: i === 0 ? "none" : "1px solid #eee" }}
                    >
                      <Td>
                        <strong>{it.time}</strong>
                      </Td>
                      <Td>
                        <strong>{it.patientName}</strong>
                        {it.isNew && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              padding: "2px 7px",
                              borderRadius: 999,
                              backgroundColor: "#ffabc1",
                              color: "#eb3f66",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              letterSpacing: 0.5,
                            }}
                          >
                            Nuevo
                          </span>
                        )}
                        <br />
                        <span style={{ color: "#6b6b6b", fontSize: 12 }}>
                          {it.patientPhone}
                        </span>
                      </Td>
                      <Td>{it.typeName}</Td>
                      <Td>{it.modality === "virtual" ? "Virtual" : "Presencial"}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          <Hr style={{ margin: "28px 0 16px 0", borderColor: "#eee" }} />
          <Text style={{ fontSize: 12, color: "#6b6b6b", margin: 0 }}>
            {props.brandName ?? "Mi Clínica"} · Panel admin
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 12px",
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 1,
        color: "#6b6b6b",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: "12px",
        fontSize: 14,
        verticalAlign: "top",
      }}
    >
      {children}
    </td>
  );
}

export default DailySummaryAdminEmail;
