import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';
import { friendsAPI, type FriendUser } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function CircleManagement() {
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, [user?.id]);

  const loadFriends = async () => {
    setLoading(true);
    try {
      if (user?.id) {
        const data = await friendsAPI.list();
        if (data.success) {
          setFriends(data.friends);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load friends.');
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    // Note: The API doesn't have a remove friend endpoint yet
    // This is a placeholder for future implementation
    Alert.alert('Remove Friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            // await friendsAPI.removeFriend(friendId);
            setFriends(friends.filter(f => f.id !== friendId));
            Alert.alert('Success', 'Friend removed.');
          } catch (err) {
            Alert.alert('Error', 'Failed to remove friend.');
          }
        },
      },
    ]);
  };

  const renderFriendItem = ({ item }: { item: FriendUser }) => (
    <GlassCard borderRadius={16} intensity="light" style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <View>
        <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.medium }]}>{item.username}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveFriend(item.id)}
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: 'rgba(255,67,54,0.1)',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="close" size={20} color="#FF4336" />
      </TouchableOpacity>
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
      <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 8 }]}>Your Circle</Text>
      <Text style={[Type.body, { color: colors.textMuted, marginBottom: 20 }]}>
        Manage your friends and location sharing circle.
      </Text>

      {loading ? (
        <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
          <Text style={[Type.body, { color: colors.textMuted }]}>Loading...</Text>
        </GlassCard>
      ) : friends.length === 0 ? (
        <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
          <Ionicons name="people" size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
          <Text style={[Type.body, { color: colors.textMuted }]}>No friends yet</Text>
          <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>Add friends to share locations</Text>
        </GlassCard>
      ) : (
        <FlatList
          data={friends}
          renderItem={renderFriendItem}
          keyExtractor={item => String(item.id)}
          scrollEnabled={false}
        />
      )}

      <GlassButton
        title="Invite Friends"
        onPress={() => Alert.alert('Share', 'Share your invite code with friends to add them to your circle.')}
        variant="secondary"
        fullWidth
        style={{ marginTop: 20 }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({});