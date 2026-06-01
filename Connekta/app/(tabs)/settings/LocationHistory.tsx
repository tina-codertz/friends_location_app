import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';
import { locationAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface LocationEntry {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export default function LocationHistory() {
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocationHistory();
  }, [user?.uid]);

  const loadLocationHistory = async () => {
    setLoading(true);
    try {
      if (user?.uid) {
        // Placeholder: In a real app, you'd have a method to get location history
        // For now, just load empty list
        setLocations([]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load location history.');
      console.error('Error loading location history:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderLocationItem = ({ item }: { item: LocationEntry }) => (
    <GlassCard borderRadius={16} intensity="light" style={{ marginBottom: 12, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            backgroundColor: accent.electricBlue,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Ionicons name="location" size={24} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.medium }]}>
            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
          </Text>
          <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      </View>
    </GlassCard>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
      }}
    >
      <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 8 }]}>Location History</Text>
      <Text style={[Type.body, { color: colors.textMuted, marginBottom: 20 }]}>
        View your recent location history for privacy and security.
      </Text>

      {loading ? (
        <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
          <Text style={[Type.body, { color: colors.textMuted }]}>Loading...</Text>
        </GlassCard>
      ) : locations.length === 0 ? (
        <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
          <Ionicons name="map" size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
          <Text style={[Type.body, { color: colors.textMuted }]}>No location history</Text>
          <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
            Enable location sharing to see history
          </Text>
        </GlassCard>
      ) : (
        <FlatList
          data={locations}
          renderItem={renderLocationItem}
          keyExtractor={(item, idx) => `${item.timestamp}-${idx}`}
          scrollEnabled={false}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({});