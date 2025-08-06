// PDF generation library using @react-pdf/renderer
import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#333333'
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 1.4
  },
  contactInfo: {
    fontSize: 11,
    marginBottom: 3,
    color: '#555555'
  }
});

// Create a React functional component for the PDF
const ResumePDF = ({ resumeData }: { resumeData: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>
          {resumeData?.contact?.name || 'Resume'}
        </Text>
        
        <Text style={styles.contactInfo}>
          Email: {resumeData?.contact?.email || 'N/A'}
        </Text>
        
        <Text style={styles.contactInfo}>
          Phone: {resumeData?.contact?.phone || 'N/A'}
        </Text>
        
        {resumeData?.summary && (
          <View style={{ marginTop: 15 }}>
            <Text style={styles.subtitle}>Professional Summary</Text>
            <Text style={styles.text}>{resumeData.summary}</Text>
          </View>
        )}
        
        {resumeData?.experience && resumeData.experience.length > 0 && (
          <View style={{ marginTop: 15 }}>
            <Text style={styles.subtitle}>Experience</Text>
            {resumeData.experience.map((exp: any, index: number) => (
              <View key={index} style={{ marginBottom: 10 }}>
                <Text style={styles.text}>
                  {exp.title} at {exp.company} ({exp.startDate} - {exp.endDate})
                </Text>
                <Text style={styles.text}>{exp.description}</Text>
              </View>
            ))}
          </View>
        )}
        
        {resumeData?.skills && resumeData.skills.length > 0 && (
          <View style={{ marginTop: 15 }}>
            <Text style={styles.subtitle}>Skills</Text>
            <Text style={styles.text}>
              {resumeData.skills.join(', ')}
            </Text>
          </View>
        )}
      </View>
    </Page>
  </Document>
);

// Export function to generate PDF buffer
export async function generateResumePDF(resumeData: any): Promise<Buffer> {
  const pdfComponent = <ResumePDF resumeData={resumeData} />;
  return await renderToBuffer(pdfComponent);
}