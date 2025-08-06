// components/pdf/ResumePDF.tsx
import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";

export type ResumeData = {
  contact?: { name?: string; email?: string; phone?: string; title?: string };
  summary?: string;
  skills?: string[];
  experience?: Array<{
    company: string;
    title?: string;
    startDate?: string; // ISO or "MMM YYYY"
    endDate?: string; // "Present" allowed
    bullets?: string[];
  }>;
  education?: Array<{ school: string; degree?: string; year?: string }>;
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  header: { fontSize: 20, marginBottom: 2 },
  subheader: { fontSize: 12, marginBottom: 2, color: "#444" },
  divider: {
    marginVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  sectionTitle: { fontSize: 13, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  text: { lineHeight: 1.3 },
  bulletRow: { flexDirection: "row", marginBottom: 2 },
  bulletDot: { width: 10 },
  bulletText: { flex: 1, lineHeight: 1.3 },
  tagWrap: { flexDirection: "row", flexWrap: "wrap" },
  tag: {
    fontSize: 10,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 4,
    marginBottom: 4,
  },
  eduItem: { marginBottom: 6 },
  expItem: { marginBottom: 8 },
});

const fmtRange = (start?: string, end?: string) => {
  const safe = (s?: string) =>
    s && s.trim().length > 0 ? s.trim() : undefined;
  const s = safe(start);
  const e = safe(end) || "Present";
  return s ? `${s} – ${e}` : e;
};

const ResumePDF = ({
  data,
}: {
  data: ResumeData;
}): ReactElement => {
  const { contact, summary, skills, experience, education } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={{ marginBottom: 8 }}>
          {contact?.name ? (
            <Text style={styles.header}>{contact.name}</Text>
          ) : null}
          {contact?.title || contact?.email || contact?.phone ? (
            <Text style={styles.subheader}>
              {[contact?.title, contact?.email, contact?.phone]
                .filter(Boolean)
                .join("  |  ")}
            </Text>
          ) : null}
        </View>

        <View style={styles.divider} />

        {/* Summary */}
        {summary ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <Text style={styles.text}>{summary}</Text>
          </View>
        ) : null}

        {/* Skills */}
        {skills && skills.length > 0 ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.tagWrap}>
              {skills.map((s, i) => (
                <Text key={i} style={styles.tag}>
                  {s}
                </Text>
              ))}
            </View>
          </View>
        ) : null}

        {/* Experience */}
        {experience && experience.length > 0 ? (
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {experience.map((role, i) => (
              <View key={i} style={styles.expItem} wrap={false}>
                <View style={styles.row}>
                  <Text style={{ fontSize: 12, fontWeight: 700 }}>
                    {role.title
                      ? `${role.title} · ${role.company}`
                      : role.company}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#555" }}>
                    {fmtRange(role.startDate, role.endDate)}
                  </Text>
                </View>
                {role.bullets?.map((b, j) => (
                  <View key={j} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {/* Education */}
        {education && education.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Education</Text>
            {education.map((ed, i) => (
              <View key={i} style={styles.eduItem}>
                <View style={styles.row}>
                  <Text style={{ fontSize: 12, fontWeight: 700 }}>
                    {ed.school}
                  </Text>
                  {ed.year ? (
                    <Text style={{ fontSize: 10, color: "#555" }}>
                      {ed.year}
                    </Text>
                  ) : null}
                </View>
                {ed.degree ? (
                  <Text style={styles.text}>{ed.degree}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
};

export default ResumePDF;
