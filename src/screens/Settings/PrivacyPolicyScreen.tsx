import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Last Updated: January 2024</Text>
        
        <Text style={styles.paragraph}>
          At LV, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information.
        </Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect information you provide directly to us, including:
        </Text>
        <Text style={styles.bullet}>• Account information (email, username)</Text>
        <Text style={styles.bullet}>• Profile information and photos</Text>
        <Text style={styles.bullet}>• Content you post (photos, stories, messages)</Text>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use the information we collect to:
        </Text>
        <Text style={styles.bullet}>• Provide and improve our services</Text>
        <Text style={styles.bullet}>• Send you notifications and updates</Text>
        <Text style={styles.bullet}>• Protect against fraud and abuse</Text>

        <Text style={styles.heading}>3. Information Sharing</Text>
        <Text style={styles.paragraph}>
          We do not sell your personal information. We may share your information only:
        </Text>
        <Text style={styles.bullet}>• With your consent</Text>
        <Text style={styles.bullet}>• To comply with legal obligations</Text>
        <Text style={styles.bullet}>• To protect our rights and safety</Text>

        <Text style={styles.heading}>4. Data Security</Text>
        <Text style={styles.paragraph}>
          We implement appropriate security measures to protect your information. However, no method of transmission over the internet is 100% secure.
        </Text>

        <Text style={styles.heading}>5. Your Rights</Text>
        <Text style={styles.paragraph}>
          You have the right to:
        </Text>
        <Text style={styles.bullet}>• Access your personal information</Text>
        <Text style={styles.bullet}>• Update or correct your information</Text>
        <Text style={styles.bullet}>• Delete your account and data</Text>

        <Text style={styles.heading}>6. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Our service is not intended for children under 13. We do not knowingly collect information from children under 13.
        </Text>

        <Text style={styles.heading}>7. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date.
        </Text>

        <Text style={styles.heading}>8. Contact Us</Text>
        <Text style={styles.paragraph}>
          If you have questions about this Privacy Policy, please contact us at privacy@lvket.app
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

