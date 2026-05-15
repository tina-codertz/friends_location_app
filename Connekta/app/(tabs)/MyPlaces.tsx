// import React, { useState, useCallback } from 'react';
// import {
//   View,
//   Text,
//   ScrollView,
//   FlatList,
//   TouchableOpacity,
//   Alert,
//   StyleSheet,
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { GlassCard } from '@/components/ui/GlassCard';
// import { GlassButton } from '@/components/ui/GlassButton';
// import { useAppTheme } from '@/context/ThemeContext';
// import { Font, Type } from '@/constants/typography';

// interface Place {
//   id: string;
//   name: string;
//   latitude: number;
//   longitude: number;
//   icon: string;
// }

// const SAMPLE_PLACES: Place[] = [
//   { id: '1', name: 'Home', latitude: 37.7749, longitude: -122.4194, icon: 'home' },
//   { id: '2', name: 'Work', latitude: 37.3382, longitude: -121.8863, icon: 'briefcase' },
//   { id: '3', name: 'Gym', latitude: 37.7749, longitude: -122.4094, icon: 'fitness' },
// ];

// export default function MyPlacesScreen() {
//   const insets = useSafeAreaInsets();
//   const { colors, accent } = useAppTheme();
//   const [places, setPlaces] = useState<Place[]>(SAMPLE_PLACES);
//   const [editingId, setEditingId] = useState<string | null>(null);

//   const handleDelete = useCallback((id: string) => {
//     Alert.alert('Delete Place', 'Remove this saved place?', [
//       { text: 'Cancel', style: 'cancel' },
//       {
//         text: 'Delete',
//         style: 'destructive',
//         onPress: () => setPlaces(places.filter(p => p.id !== id)),
//       },
//     ]);
//   }, [places]);

//   const handleAddPlace = useCallback(() => {
//     Alert.prompt(
//       'Add Place',
//       'Enter place name',
//       [
//         { text: 'Cancel', style: 'cancel' },
//         {
//           text: 'Add',
//           onPress: (name?: string) => {
//             if (name?.trim()) {
//               setPlaces([
//                 ...places,
//                 {
//                   id: String(places.length + 1),
//                   name: name.trim(),
//                   latitude: 37.7749,
//                   longitude: -122.4194,
//                   icon: 'location',
//                 },
//               ]);
//             }
//           },
//         },
//       ]
//     );
//   }, [places]);

//   const renderPlaceItem = ({ item }: { item: Place }) => (
//     <GlassCard borderRadius={16} intensity="light" style={{ marginBottom: 12, paddingVertical: 14 }}>
//       <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
//         <View
//           style={{
//             width: 48,
//             height: 48,
//             borderRadius: 12,
//             backgroundColor: accent.electricBlue,
//             justifyContent: 'center',
//             alignItems: 'center',
//           }}
//         >
//           <Ionicons name={item.icon as any} size={24} color="#fff" />
//         </View>
//         <View style={{ flex: 1 }}>
//           <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
//             {item.name}
//           </Text>
//           <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
//             {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
//           </Text>
//         </View>
//         <TouchableOpacity
//           onPress={() => handleDelete(item.id)}
//           style={{
//             width: 40,
//             height: 40,
//             borderRadius: 8,
//             backgroundColor: 'rgba(255,67,54,0.1)',
//             justifyContent: 'center',
//             alignItems: 'center',
//           }}
//         >
//           <Ionicons name="close" size={20} color="#FF4336" />
//         </TouchableOpacity>
//       </View>
//     </GlassCard>
//   );

//   return (
//     <ScrollView
//       style={{ flex: 1, backgroundColor: colors.bg }}
//       contentContainerStyle={{
//         padding: 20,
//         paddingTop: insets.top + 12,
//         paddingBottom: insets.bottom + 40,
//       }}
//     >
//       <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 8 }]}>My Places</Text>
//       <Text style={[Type.body, { color: colors.textMuted, marginBottom: 20 }]}>
//         Save and manage your favorite locations.
//       </Text>

//       {places.length === 0 ? (
//         <GlassCard borderRadius={16} intensity="light" style={{ padding: 20, alignItems: 'center' }}>
//           <Ionicons name="location" size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
//           <Text style={[Type.body, { color: colors.textMuted }]}>No places saved</Text>
//           <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>Add your first place below</Text>
//         </GlassCard>
//       ) : (
//         <FlatList data={places} renderItem={renderPlaceItem} keyExtractor={item => item.id} scrollEnabled={false} />
//       )}

//       <GlassButton
//         title="Add New Place"
//         onPress={handleAddPlace}
//         variant="secondary"
//         fullWidth
//         style={{ marginTop: 20 }}
//       />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({});
