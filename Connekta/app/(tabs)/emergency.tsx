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

  const remove = async (id: number) => {
    try {
      await emergencyAPI.remove(id);
      void load();
    } catch (err) {
      Alert.alert('Error', 'Failed to remove contact.');
    }
  };

  const acceptContact = async (id: number) => {
    try {
      await emergencyAPI.accept(id);
      void load();
      Alert.alert('Success', 'Emergency contact accepted.');
    } catch (err) {
      Alert.alert('Error', 'Failed to accept contact.');
    }
  };

  const rejectContact = async (id: number) => {
    try {
      await emergencyAPI.reject(id);
      void load();
    } catch (err) {
      Alert.alert('Error', 'Failed to reject contact.');
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

            <GlassCard borderRadius={22} intensity="medium" style={{ borderColor: `${accent.coral}44`, borderWidth: 1 }}>
              <Text style={[Type.section, { color: accent.coral, marginBottom: 8 }]}>Share by link</Text>
              <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 14 }]}>
                Send a short invite or deep link so trusted contacts know how to reach you on Connekta.
              </Text>
              <GlassButton title="Share invite" onPress={shareLiveLink} variant="primary" fullWidth size="large" />
            </GlassCard>

            <GlassCard borderRadius={22} intensity="heavy">
              <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 12 }]}>Safety Contacts</Text>
              <TextInput
                placeholder="Name"
                placeholderTextColor={colors.inputPlaceholder}
                value={name}
                onChangeText={setName}
                style={[
                  styles.input,
                  { color: colors.textPrimary, borderColor: colors.inputBorder, fontFamily: Font.regular },
                ]}
              />
              <TextInput
                placeholder="Phone"
                placeholderTextColor={colors.inputPlaceholder}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  { color: colors.textPrimary, borderColor: colors.inputBorder, fontFamily: Font.regular, marginTop: 10 },
                ]}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14, alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <GlassButton title="Save contact" onPress={add} variant="secondary" fullWidth />
                </View>
                <TouchableOpacity
                  onPress={pickContact}
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: accent.electricBlue,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="person-add-outline" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 12 }}>
                <GlassButton 
                  title="Add from form" 
                  onPress={() => router.push('/emergency/EmergencyForm')} 
                  variant="ghost" 
                  fullWidth 
                />
              </View>
            </GlassCard>

            <Text style={[Type.caption, { color: colors.textMuted }]}>
              Signed in as <Text style={{ fontFamily: Font.semibold, color: colors.textSecondary }}>{user?.username}</Text>
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isPending = item.status === 'pending';
          return (
            <GlassCard 
              borderRadius={22} 
              intensity={isPending ? 'light' : 'medium'} 
              style={{ 
                paddingVertical: 14, 
                borderColor: isPending ? `${accent.orange}44` : undefined,
                borderWidth: isPending ? 1 : 0,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: isPending ? `${accent.orange}22` : `${accent.electricBlue}22`,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons 
                    name={isPending ? 'hourglass' : 'checkmark-circle'} 
                    size={20} 
                    color={isPending ? accent.orange : accent.electricBlue} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
                      {item.name}
                    </Text>
                    {isPending && (
                      <View style={{ backgroundColor: accent.orange, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={[Type.caption, { color: '#fff', fontFamily: Font.medium }]}>Pending</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>{item.phone}</Text>
                </View>
                {isPending ? (
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => acceptContact(item.id)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: `${accent.green}22`,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="checkmark" size={18} color={accent.green} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => rejectContact(item.id)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        backgroundColor: 'rgba(255,67,54,0.15)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Ionicons name="close" size={18} color="#FF4336" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => remove(item.id)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      backgroundColor: 'rgba(255,67,54,0.15)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="close" size={18} color="#FF4336" />
                  </TouchableOpacity>
                )}
              </View>
            </GlassCard>
          );
        }}
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
