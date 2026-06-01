import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Share,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as Contacts from 'expo-contacts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { useAppTheme } from '@/context/ThemeContext';
import { emergencyAPI, type EmergencyContact } from '@/services/api';
import { Font, Type } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';

export default function EmergencyTabScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

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

        // Automatically add the selected contact to emergency contacts
        try {
          await emergencyAPI.add(contactName.trim(), contactPhone.trim());
          void load();
          Alert.alert('Success', `${contactName} added to emergency contacts.`);
        } catch (err) {
          Alert.alert('Error', 'Failed to add contact.');
        }
      }
    } catch (err) {
      console.error('Error picking contact:', err);
    }
  };

  const add = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Add a name and phone number.');
      return;
    }
    try {
      await emergencyAPI.add(name.trim(), phone.trim());
      setName('');
      setPhone('');
      void load();
      Alert.alert('Success', 'Contact added.');
    } catch (err) {
      Alert.alert('Error', 'Failed to add contact.');
    }
  };

  const remove = async (id: string) => {
    try {
      await emergencyAPI.remove(id);
      void load();
    } catch (err) {
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

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      <FlatList
        data={contacts}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 120,
          gap: 12,
        }}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 8 }}>
            <Text style={[Type.hero, { color: colors.textPrimary }]}>Safety</Text>
            <Text style={[Type.body, { color: colors.textMuted }]}>
              Add trusted emergency contacts and share your location link with them for your safety.
            </Text>


            <GlassCard borderRadius={16} intensity="heavy" glowAccent>
              <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 8 }]}>Safety contacts</Text>
              <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 16 }]}>
                Add people who can be reached in an emergency.
              </Text>
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

            <Text style={[Type.caption, { color: colors.textMuted }]}>
              Signed in as <Text style={{ fontFamily: Font.semibold, color: colors.textSecondary }}>{user?.username}</Text>
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              router.push({
                pathname: '/emergency/EmergencyContactsDetails',
                params: { id: String(item.id), name: item.name, phone: item.phone },
              })
            }
          >
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
                  }}
                >
                  <Ionicons name="person" size={20} color={accent.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
                    {item.name}
                  </Text>
                  <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>{item.phone}</Text>
                </View>
                <GlassIconButton name="trash-outline" onPress={() => remove(item.id)} danger />
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
            <Text style={[Type.body, { color: colors.textMuted }]}>No contacts yet</Text>
            <Text style={[Type.caption, { color: colors.textMuted }]}>Add people you trust for emergencies</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
