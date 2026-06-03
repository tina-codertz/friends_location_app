import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Share,
  Alert,
  StyleSheet,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { locationAPI } from '@/services/api';
import { Font, Type } from '@/constants/typography';

export default function ShareLocationScreen() {
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const [liveSharing, setLiveSharing] = useState(false);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);

  React.useEffect(() => {
    void (async () => {
      try {
        const s = await locationAPI.myState();
        if (s.success) {
          setLiveSharing(!!s.sharing);
          if (typeof s.lat === 'number' && typeof s.lng === 'number') {
            setCurrentLat(s.lat);
            setCurrentLng(s.lng);
          }
        }
      } catch {
        /* offline */
      }
    })();
  }, []);

  const handleShareLocation = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLat(location.coords.latitude);
      setCurrentLng(location.coords.longitude);

      const mapsUrl = `https://maps.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`;
      const message = `${user?.username} is sharing their location: ${mapsUrl}`;

      await Share.share({ message, title: 'Share Location' });
    } catch (err) {
      Alert.alert('Error', 'Could not get your location. Check permissions.');
    }
  }, [user]);

  const toggleLiveSharing = useCallback(async (value: boolean) => {
    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Enable location permissions to share live.');
        return;
      }
    }
    setLiveSharing(value);
    try {
      await locationAPI.setSharing(value);
      if (value) {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        await locationAPI.ping(pos.coords.latitude, pos.coords.longitude);
      }
    } catch {
      setLiveSharing(!value);
      Alert.alert('Error', 'Could not update sharing. Try again on the Map tab.');
    }
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
      }}
    >
      <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 8 }]}>Share Location</Text>
      <Text style={[Type.body, { color: colors.textMuted, marginBottom: 20 }]}>
        Share your location with trusted contacts.
      </Text>

      {/* Live Sharing Toggle */}
      <GlassCard borderRadius={16} intensity="medium" style={{ marginBottom: 16 }}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
              Live Location Sharing
            </Text>
            <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
              {liveSharing ? 'Sharing active' : 'Currently off'}
            </Text>
          </View>
          <Switch
            value={liveSharing}
            onValueChange={toggleLiveSharing}
            trackColor={{ false: colors.divider, true: `${accent.electricBlue}88` }}
            thumbColor={liveSharing ? accent.electricBlue : colors.textTertiary}
          />
        </View>
      </GlassCard>

      {/* Current Location Card */}
      {currentLat && currentLng && (
        <GlassCard borderRadius={16} intensity="medium" style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Ionicons name="location" size={24} color={accent.electricBlue} />
            <Text style={[Type.section, { color: colors.textPrimary }]}>Current Location</Text>
          </View>
          <Text style={[Type.caption, { color: colors.textMuted }]}>
            Latitude: {currentLat.toFixed(6)}
          </Text>
          <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
            Longitude: {currentLng.toFixed(6)}
          </Text>
        </GlassCard>
      )}

     


      {/* Share Button */}
      <GlassButton
        title="Share My Location Now"
        onPress={handleShareLocation}
        variant="primary"
        fullWidth
      />

      {/* Info Box */}
      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: `${accent.electricBlue}11`,
            borderColor: `${accent.electricBlue}44`,
            marginTop: 20,
          },
        ]}
      >
        <Ionicons name="information-circle" size={20} color={accent.electricBlue} style={{ marginRight: 10 }} />
        <Text style={[Type.caption, { color: colors.textMuted, flex: 1 }]}>
          Only accepted circle members can see your shared location.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
