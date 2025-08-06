import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 20, marginBottom: 10 },
  text: { fontSize: 12, marginBottom: 5 }
});

// Use React.createElement instead of JSX to avoid transpilation issues
export const createPDFElement = (resumeData: any) => {
  return React.createElement(Document, {},
    React.createElement(Page, { size: "A4", style: styles.page },
      React.createElement(View, {},
        React.createElement(Text, { style: styles.title }, resumeData?.contact?.name || 'Resume'),
        React.createElement(Text, { style: styles.text }, `Email: ${resumeData?.contact?.email || 'N/A'}`),
        React.createElement(Text, { style: styles.text }, `Phone: ${resumeData?.contact?.phone || 'N/A'}`),
        resumeData?.summary && React.createElement(View, {},
          React.createElement(Text, { style: styles.title }, 'Summary'),
          React.createElement(Text, { style: styles.text }, resumeData.summary)
        )
      )
    )
  );
};