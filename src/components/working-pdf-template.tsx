import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
  }
});

interface WorkingPDFTemplateProps {
  resumeData: any;
}

// This must be a named function component for @react-pdf/renderer
function WorkingPDFTemplate({ resumeData }: WorkingPDFTemplateProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.title}>
            {resumeData?.contact?.name || 'Resume'}
          </Text>
          <Text style={styles.text}>
            {resumeData?.summary || 'No summary available'}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export default WorkingPDFTemplate;