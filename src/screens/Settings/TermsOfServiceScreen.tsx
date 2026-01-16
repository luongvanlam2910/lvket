import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Last Updated: January 2024</Text>
        
        <Text style={styles.paragraph}>
          Welcome to LVket! These Terms of Service ("Terms") govern your use of our mobile application and services.
        </Text>

        <Text style={styles.heading}>1. Acceptance of Terms</Text>
        <Text style={styles.paragraph}>
          By accessing or using LVket, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the service.
        </Text>

        <Text style={styles.heading}>2. User Accounts</Text>
        <Text style={styles.paragraph}>
          You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
        </Text>

        <Text style={styles.heading}>3. User Content</Text>
        <Text style={styles.paragraph}>
          You retain ownership of any content you post. By posting content, you grant us a license to use, modify, and display that content in connection with the service.
        </Text>

        <Text style={styles.heading}>4. Prohibited Uses</Text>
        <Text style={styles.paragraph}>
          You may not use the service to:
        </Text>
        <Text style={styles.bullet}>• Post illegal, harmful, or offensive content</Text>
        <Text style={styles.bullet}>• Harass, abuse, or harm other users</Text>
        <Text style={styles.bullet}>• Violate any applicable laws or regulations</Text>

        <Text style={styles.heading}>5. Privacy</Text>
        <Text style={styles.paragraph}>
          Your use of the service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices.
        </Text>

        <Text style={styles.heading}>6. Termination</Text>
        <Text style={styles.paragraph}>
          We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms.
        </Text>

        <Text style={styles.heading}>7. Changes to Terms</Text>
        <Text style={styles.paragraph}>
          We reserve the right to modify these Terms at any time. We will notify users of any changes by updating the "Last Updated" date.
        </Text>

        <Text style={styles.heading}>8. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have any questions about these Terms, please contact us at support@lvket.app
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    color: '#999',
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginBottom: 15,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginLeft: 10,
    marginBottom: 5,
  },
});

