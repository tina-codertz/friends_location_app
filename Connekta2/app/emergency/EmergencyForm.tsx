import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import { emergencyAPI } from '@/services/api';

export default function EmergencyForm() {
  const router = useRouter();
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
    } catch {
      Alert.alert('Error', 'Failed to add contact.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <NativeScreen scroll contentStyle={{ gap: 16, paddingBottom: 40 }}>
      <NativeTypography variant="hero" color={colors.textPrimary}>
        Add Emergency Contact
      </NativeTypography>
      <NativeTypography variant="body" color={colors.textMuted}>
        Add a trusted contact who can be reached in case of emergency.
      </NativeTypography>

      <GlassCard borderRadius={16} intensity="heavy" glowAccent style={{ gap: 16 }}>
        <GlassInput
          layout="stacked"
          label="Full Name"
          placeholder="Enter name"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        <GlassInput
          layout="stacked"
          label="Phone Number"
          placeholder="Enter phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!loading}
        />
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

      <GlassButton title="Cancel" onPress={() => router.back()} variant="tonal" fullWidth />
    </NativeScreen>
  );
}
