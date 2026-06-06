import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Share, Alert, Pressable } from 'react-native';
import * as Linking from 'expo-linking';
import * as Contacts from 'expo-contacts';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import { emergencyAPI, type EmergencyContact } from '@/services/api';
import { Font } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';

export default function EmergencyTabScreen() {
  const router = useRouter();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  const load = useCallback(async () => {
    try {
      const res = await emergencyAPI.list();
      if (res.success) setContacts(res.contacts);
    } catch {
      /* offline */
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const pickContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Allow access to contacts to pick a contact.');
        return;
      }
      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        const contactName = contact.name || '';
        let contactPhone = '';
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          contactPhone = contact.phoneNumbers[0].number?.replace(/\D/g, '') || '';
        }

        if (!contactName.trim() || !contactPhone.trim()) {
          Alert.alert('Invalid contact', 'Contact must have a name and phone number.');
          return;
        }

        try {
          await emergencyAPI.add(contactName.trim(), contactPhone.trim());
          void load();
          Alert.alert('Success', `${contactName} added to emergency contacts.`);
        } catch {
          Alert.alert('Error', 'Failed to add contact.');
        }
      }
    } catch (err) {
      console.error('Error picking contact:', err);
    }
  };

  const remove = async (id: string) => {
    try {
      await emergencyAPI.remove(id);
      void load();
    } catch {
      Alert.alert('Error', 'Failed to remove contact.');
    }
  };

  const shareLiveLink = async () => {
    const url = Linking.createURL('/map', { scheme: 'connekta' });
    const message = `If you need me, I use Connekta for live location with trusted friends. Invite: ${url}`;
    try {
      await Share.share({ message, title: 'Connekta' });
    } catch {
      /* cancelled */
    }
  };

  const signedInText = `Signed in as ${user?.username ?? '—'}`;

  return (
    <NativeScreen contentStyle={{ paddingHorizontal: 0 }}>
      <FlatList
        data={contacts}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 120,
          gap: 12,
        }}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 8 }}>
            <NativeTypography variant="hero" color={colors.textPrimary}>
              Safety
            </NativeTypography>
            <NativeTypography variant="body" color={colors.textMuted}>
              Add trusted emergency contacts and share your location link with them for your safety.
            </NativeTypography>

            <GlassCard borderRadius={16} intensity="heavy" glowAccent>
              <NativeTypography variant="section" color={colors.textPrimary} textStyle={{ marginBottom: 8 }}>
                Safety contacts
              </NativeTypography>
              <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginBottom: 16 }}>
                Add people who can be reached in an emergency.
              </NativeTypography>
              <View style={{ gap: 10 }}>
                <GlassButton
                  title="Add from contacts"
                  onPress={pickContact}
                  variant="primary"
                  fullWidth
                  icon={<Ionicons name="person-add" size={18} color="#002022" />}
                />
                <GlassButton
                  title="Add manually"
                  onPress={() => router.push('/emergency/EmergencyForm')}
                  variant="tonal"
                  fullWidth
                  icon={<Ionicons name="create-outline" size={18} color={accent.cyan} />}
                />
                <GlassButton
                  title="Share safety link"
                  onPress={shareLiveLink}
                  variant="tonal"
                  fullWidth
                  icon={<Ionicons name="share-outline" size={18} color={accent.cyan} />}
                />
                <GlassButton
                  title="Emergency SOS"
                  onPress={() => router.push('/(tabs)/SOSScreen')}
                  variant="danger"
                  fullWidth
                  icon={<Ionicons name="warning" size={18} color="#fff" />}
                />
              </View>
            </GlassCard>

            <NativeTypography variant="caption" color={colors.textMuted}>
              {signedInText}
            </NativeTypography>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/emergency/EmergencyContactsDetails',
                params: { id: String(item.id), name: item.name, phone: item.phone },
              })
            }>
            <GlassCard borderRadius={16} intensity="medium" padding={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: `${accent.cyan}22`,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Ionicons name="person" size={20} color={accent.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <NativeTypography
                    variant="body"
                    color={colors.textPrimary}
                    textStyle={{ fontFamily: Font.semibold }}>
                    {item.name}
                  </NativeTypography>
                  <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 4 }}>
                    {item.phone}
                  </NativeTypography>
                </View>
                <GlassIconButton name="trash-outline" onPress={() => remove(item.id)} danger />
              </View>
            </GlassCard>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
            <NativeTypography variant="body" color={colors.textMuted}>
              No contacts yet
            </NativeTypography>
            <NativeTypography variant="caption" color={colors.textMuted}>
              Add people you trust for emergencies
            </NativeTypography>
          </View>
        }
      />
    </NativeScreen>
  );
}
