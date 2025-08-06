import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  },
});

interface SimplePDFTemplateProps {
  resumeData: any;
}

export function SimplePDFTemplate({ resumeData }: SimplePDFTemplateProps) {
  return (
    <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>
          {resumeData.contact?.name || resumeData.personalInfo?.name || 'Resume'}
        </Text>
        <Text style={styles.text}>
          Email: {resumeData.contact?.email || resumeData.personalInfo?.email || 'N/A'}
        </Text>
        <Text style={styles.text}>
          Phone: {resumeData.contact?.phone || resumeData.personalInfo?.phone || 'N/A'}
        </Text>
      </View>
      
      {resumeData.summary && (
        <View style={styles.section}>
          <Text style={styles.title}>Summary</Text>
          <Text style={styles.text}>{resumeData.summary}</Text>
        </View>
      )}
      
      {resumeData.skills && resumeData.skills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.title}>Skills</Text>
          <Text style={styles.text}>
            {resumeData.skills.map((skill: any) => 
              typeof skill === 'string' ? skill : skill.name
            ).join(', ')}
          </Text>
        </View>
      )}
      
      {resumeData.experience && resumeData.experience.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.title}>Experience</Text>
          {resumeData.experience.map((exp: any, index: number) => (
            <View key={index} style={{ marginBottom: 10 }}>
              <Text style={styles.text}>
                {exp.position || exp.title} at {exp.company}
              </Text>
              <Text style={styles.text}>
                {exp.startDate} - {exp.endDate || 'Present'}
              </Text>
              {exp.description && (
                <Text style={styles.text}>{exp.description}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </Page>
    </Document>
  );
}