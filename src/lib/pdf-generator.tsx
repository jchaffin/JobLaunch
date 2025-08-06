// PDF generation library using @react-pdf/renderer
import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Font } from '@react-pdf/renderer';

// Register fonts for better typography
Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
});

const styles = StyleSheet.create({
  page: { 
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Inter',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 15,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 5,
  },
  contactItem: {
    fontSize: 10,
    color: '#6b7280',
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 4,
  },
  summary: {
    fontSize: 11,
    lineHeight: 1.6,
    color: '#374151',
    textAlign: 'justify',
  },
  experienceItem: {
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  jobTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1f2937',
    flex: 1,
  },
  jobCompany: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  jobDuration: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  jobLocation: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  jobDescription: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
    marginBottom: 6,
  },
  achievementsList: {
    marginLeft: 10,
  },
  achievementItem: {
    fontSize: 10,
    lineHeight: 1.4,
    color: '#374151',
    marginBottom: 3,
    flexDirection: 'row',
  },
  bullet: {
    fontSize: 8,
    color: '#2563eb',
    marginRight: 6,
    marginTop: 2,
  },
  skillsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    fontSize: 9,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '4 8',
    borderRadius: 4,
    border: '1px solid #e5e7eb',
  },
  educationItem: {
    marginBottom: 12,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  educationDegree: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  educationInstitution: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '600',
  },
  educationYear: {
    fontSize: 10,
    color: '#6b7280',
  },
  educationDetails: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
  },
});

// Helper function to format dates
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return 'Present';
  if (typeof date === 'string') {
    // Handle string dates - try to parse and format
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return `${parsed.getMonth() + 1}/${parsed.getFullYear()}`;
    }
    return date; // Return as-is if can't parse
  }
  
  // For Date objects, use MM/YYYY format
  return `${date.getMonth() + 1}/${date.getFullYear()}`;
};

// Helper function to format duration
const formatDuration = (startDate: Date | string | undefined, endDate: Date | string | undefined): string => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} - ${end}`;
};

// Create a React functional component for the PDF
const ResumePDF = ({ resumeData }: { resumeData: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.name}>
          {resumeData?.contact?.name || 'Your Name'}
        </Text>
        
        <View style={styles.contactInfo}>
          {resumeData?.contact?.email && (
            <Text style={styles.contactItem}>📧 {resumeData.contact.email}</Text>
          )}
          {resumeData?.contact?.phone && (
            <Text style={styles.contactItem}>📞 {resumeData.contact.phone}</Text>
          )}
          {resumeData?.contact?.location && (
            <Text style={styles.contactItem}>📍 {resumeData.contact.location}</Text>
          )}
          {resumeData?.contact?.linkedin && (
            <Text style={styles.contactItem}>💼 {resumeData.contact.linkedin}</Text>
          )}
        </View>
      </View>

      {/* Professional Summary */}
      {resumeData?.summary && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Summary</Text>
          <Text style={styles.summary}>{resumeData.summary}</Text>
        </View>
      )}

      {/* Experience Section */}
      {resumeData?.experience && resumeData.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Experience</Text>
          {resumeData.experience.map((exp: any, index: number) => (
            <View key={index} style={styles.experienceItem}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{exp.role}</Text>
                <Text style={styles.jobDuration}>
                  {formatDuration(exp.startDate, exp.endDate)}
                </Text>
              </View>
              
              <Text style={styles.jobCompany}>{exp.company}</Text>
              
              {exp.location && (
                <Text style={styles.jobLocation}>{exp.location}</Text>
              )}
              
              {exp.description && (
                <View style={styles.achievementsList}>
                  {exp.description.split('\n').map((line: string, lineIndex: number) => {
                    const trimmedLine = line.trim();
                    if (trimmedLine) {
                      return (
                        <View key={lineIndex} style={styles.achievementItem}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={{ flex: 1 }}>{trimmedLine}</Text>
                        </View>
                      );
                    }
                    return null;
                  })}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Skills Section */}
      {resumeData?.skills && resumeData.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Technologies</Text>
          <View style={styles.skillsSection}>
            {resumeData.skills.map((skill: string, index: number) => (
              <Text key={index} style={styles.skillTag}>
                {skill}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Education Section */}
      {resumeData?.education && resumeData.education.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          {resumeData.education.map((edu: any, index: number) => (
            <View key={index} style={styles.educationItem}>
              <View style={styles.educationHeader}>
                <Text style={styles.educationDegree}>
                  {edu.degree} {edu.field && `in ${edu.field}`}
                </Text>
                <Text style={styles.educationYear}>{edu.year}</Text>
              </View>
              
              <Text style={styles.educationInstitution}>{edu.institution}</Text>
              
              {(edu.gpa || edu.honors) && (
                <Text style={styles.educationDetails}>
                  {edu.gpa && `GPA: ${edu.gpa}`}
                  {edu.gpa && edu.honors && ' • '}
                  {edu.honors && edu.honors}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </Page>
  </Document>
);

// Export function to generate PDF buffer
export async function generateResumePDF(resumeData: any): Promise<Buffer> {
  const pdfComponent = <ResumePDF resumeData={resumeData} />;
  return await renderToBuffer(pdfComponent);
}