import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Font, Type } from '@/constants/typography';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');

  const handleSave = async () => {
    if (editUsername.trim().length < 2) {
      Alert.alert('Invalid', 'Username must be at least 2 characters.');
      return;
    }

    Alert.alert('Profile updated', 'Your profile has been updated.');
    setIsEditing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ 
        padding: 20, 
        paddingTop: insets.top + 12, 
        paddingBottom: insets.bottom + 40 
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={[Type.hero, { color: colors.textPrimary }]}>Profile</Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={{
            backgroundColor: colors.inputBg,
            borderWidth: 1,
            borderColor: colors.inputBorder,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Ionicons
            name={isEditing ? 'close' : 'pencil'}
            size={18}
            color={accent.electricBlue}
          />
        </TouchableOpacity>
      </View>

      <GlassCard borderRadius={24} intensity="heavy" glowAccent style={{ paddingVertical: 28, alignItems: 'center' }}>
        <View style={[styles.avatar, { borderColor: colors.tealBorder }]}>
          <Text style={{ fontSize: 36, color: colors.textPrimary, fontFamily: Font.bold }}>
            {(editUsername ?? '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        {isEditing ? (
          <TextInput
            value={editUsername}
            onChangeText={setEditUsername}
            placeholder="Username"
            placeholderTextColor={colors.inputPlaceholder}
            style={[
              styles.usernameInput,
              {
                color: colors.textPrimary,
                borderColor: colors.inputBorder,
                backgroundColor: colors.inputBg,
                fontFamily: Font.semibold,
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : (
          <Text style={[Type.title, { color: colors.textPrimary, marginTop: 16 }]}>{user?.username}</Text>
        )}
        <Text style={[Type.body, { color: colors.textMuted, marginTop: 6 }]}>{user?.email}</Text>
      </GlassCard>

      <View style={{ height: 20 }} />

      <GlassCard borderRadius={22} intensity="medium">
        
        <Row label="Account" value="Active" colors={colors} />
        <Row
          label="User ID"
          value={user?.uid ? `${user.uid.slice(0, 8)}…` : '—'}
          colors={colors}
          muted
        />
      </GlassCard>

      {isEditing && (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <GlassButton
            title="Save"
            onPress={handleSave}
            variant="primary"
            fullWidth
            // flex={1}
          />
          <GlassButton
            title="Cancel"
            onPress={() => {
              setEditUsername(user?.username || '');
              setIsEditing(false);
            }}
            variant="ghost"
            fullWidth
            // flex={1}
          />
        </View>
      )}
    </ScrollView>
  );
}

function Row({
  label,
  value,
  colors,
  muted,
}: {
  label: string;
  value: string;
  colors: any;
  muted?: boolean;
}) {
  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.divider }}>
      <Text style={[Type.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[
          Type.body,
          { color: muted ? colors.textMuted : colors.textPrimary, marginTop: 4, fontFamily: Font.medium },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  usernameInput: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    textAlign: 'center',
    minWidth: 200,
  },
});
