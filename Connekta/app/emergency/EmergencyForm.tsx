import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';
import { emergencyAPI } from '@/services/api';
import { GlassIconButton } from '@/components/ui/GlassIconButton';

export default function EmergencyForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const pickContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow access to contacts to pick a contact.');
        return;
      }
      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        setName(contact.name || '');
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          const cleanPhone = contact.phoneNumbers[0].number?.replace(/\D/g, '') || '';
          setPhone(cleanPhone);
        }
      }
    } catch (err) {
      console.error('Error picking contact:', err);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Add a name and phone number.');
      return;
    }

    setLoading(true);
    try {
      await emergencyAPI.add(name.trim(), phone.trim());
      Alert.alert('Success', 'Emergency contact added.');
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to add contact.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
      }}
    >
      <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 8 }]}>Add Emergency Contact</Text>
      <Text style={[Type.body, { color: colors.textMuted, marginBottom: 20 }]}>
        Add a trusted contact who can be reached in case of emergency.
      </Text>

      <GlassCard borderRadius={16} intensity="heavy" glowAccent style={{ gap: 16 }}>
        <View>
          <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 8 }]}>Full Name</Text>
          <TextInput
            placeholder="Enter name"
            placeholderTextColor={colors.inputPlaceholder}
            value={name}
            onChangeText={setName}
            editable={!loading}
            style={[
              styles.input,
              { color: colors.textPrimary, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, fontFamily: Font.regular },
            ]}
          />
        </View>

        <View>
          <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 8 }]}>Phone Number</Text>
          <TextInput
            placeholder="Enter phone number"
            placeholderTextColor={colors.inputPlaceholder}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            editable={!loading}
            style={[
              styles.input,
              { color: colors.textPrimary, borderColor: colors.inputBorder, backgroundColor: colors.inputBg, fontFamily: Font.regular },
            ]}
          />
        </View>

        <GlassButton
          title="Pick from contacts"
          onPress={pickContact}
          variant="tonal"
          fullWidth
          disabled={loading}
          icon={<Ionicons name="person-add-outline" size={18} color={accent.cyan} />}
        />
        <GlassButton
          title={loading ? 'Saving…' : 'Save contact'}
          onPress={handleSubmit}
          variant="primary"
          fullWidth
          disabled={loading}
          loading={loading}
        />
      </GlassCard>

      <GlassButton
        title="Cancel"
        onPress={() => router.back()}
        variant="tonal"
        fullWidth
        style={{ marginTop: 12 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
