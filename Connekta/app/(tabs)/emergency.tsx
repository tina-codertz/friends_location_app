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
} from 'react-native';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { emergencyAPI, type EmergencyContact } from '@/services/api';
import { Font, Type } from '@/constants/typography';
import { useAuth } from '@/context/AuthContext';

export default function EmergencyTabScreen() {
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

  const add = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Missing info', 'Add a name and phone number.');
      return;
    }
    await emergencyAPI.add(name.trim(), phone.trim());
    setName('');
    setPhone('');
    void load();
  };

  const remove = async (id: number) => {
    await emergencyAPI.remove(id);
    void load();
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
          paddingBottom: insets.bottom + 100,
          gap: 12,
        }}
        ListHeaderComponent={
          <View style={{ gap: 16, marginBottom: 8 }}>
            <Text style={[Type.hero, { color: colors.textPrimary }]}>Emergency</Text>
            <Text style={[Type.body, { color: colors.textMuted }]}>
              Coral accents keep SOS feeling urgent yet modern. Location sharing stays in the Map tab and is always
              opt-in.
            </Text>

            <GlassCard borderRadius={22} intensity="medium" style={{ borderColor: `${accent.coral}44`, borderWidth: 1 }}>
              <Text style={[Type.section, { color: accent.coral, marginBottom: 8 }]}>Share by link</Text>
              <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 14 }]}>
                Send a short invite or deep link so trusted contacts know how to reach you on Connekta.
              </Text>
              <GlassButton title="Share invite" onPress={shareLiveLink} variant="primary" fullWidth size="large" />
            </GlassCard>

            <GlassCard borderRadius={22} intensity="heavy">
              <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 12 }]}>Emergency contacts</Text>
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
              <View style={{ height: 14 }} />
              <GlassButton title="Save contact" onPress={add} variant="secondary" fullWidth />
            </GlassCard>

            <Text style={[Type.caption, { color: colors.textMuted }]}>
              Signed in as <Text style={{ fontFamily: Font.semibold, color: colors.textSecondary }}>{user?.username}</Text>
              {Platform.OS === 'web' ? '' : ''}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard borderRadius={22} intensity="light" style={{ paddingVertical: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>{item.name}</Text>
                <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>{item.phone}</Text>
              </View>
              <GlassButton title="Remove" onPress={() => remove(item.id)} variant="ghost" size="small" />
            </View>
          </GlassCard>
        )}
        ListEmptyComponent={
          <Text style={[Type.body, { color: colors.textMuted }]}>No contacts yet. Add people you trust.</Text>
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
