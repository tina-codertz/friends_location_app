// import React, { useState, useRef, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Animated,
//   TouchableOpacity,
//   Dimensions,
//   Alert,
// } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import * as Location from 'expo-location';
// import { Ionicons } from '@expo/vector-icons';
// import { GlassCard } from '@/components/ui/GlassCard';
// import { GlassButton } from '@/components/ui/GlassButton';
// import { useAppTheme } from '@/context/ThemeContext';
// import { useAuth } from '@/context/AuthContext';
// import { emergencyAPI } from '@/services/api';
// import { Font, Type } from '@/constants/typography';

// const { height: SH, width: SW } = Dimensions.get('window');

// export default function SOSScreen() {
//   const insets = useSafeAreaInsets();
//   const { colors, accent } = useAppTheme();
//   const { user } = useAuth();
//   const [triggering, setTriggering] = useState(false);
//   const [lastSOS, setLastSOS] = useState<Date | null>(null);
  
//   const pulseAnim = useRef(new Animated.Value(1)).current;
//   const scaleAnim = useRef(new Animated.Value(0.8)).current;

//   // Pulse animation for SOS button
//   useEffect(() => {
//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
//         Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
//       ])
//     ).start();
//   }, []);

//   const triggerSOS = async () => {
//     try {
//       setTriggering(true);
//       scaleAnim.setValue(0.8);
      
//       // Animate button press
//       Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

//       // Get current location
//       const location = await Location.getCurrentPositionAsync({
//         accuracy: Location.Accuracy.Highest,
//       });

//       // Send SOS to emergency contacts
//       const response = await emergencyAPI.triggerSOS(
//         location.coords.latitude,
//         location.coords.longitude
//       );

//       setLastSOS(new Date());

//       Alert.alert(
//         'SOS Sent!',
//         `Emergency alert sent to ${response.notified} contact${response.notified === 1 ? '' : 's'}. Your location has been shared.`,
//         [{ text: 'OK', style: 'default' }]
//       );
//     } catch (err) {
//       Alert.alert('Error', 'Failed to send SOS. Check your location permissions and emergency contacts.');
//       console.error('SOS trigger error:', err);
//     } finally {
//       setTriggering(false);
//     }
//   };

//   return (
//     <View style={[styles.root, { backgroundColor: colors.bg }]}>
//       {/* Background glow */}
//       <View style={[styles.glow, { backgroundColor: accent.coral }]} />

//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
//         {/* Title */}
//         <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 24, textAlign: 'center' }]}>
//           Emergency SOS
//         </Text>

//         {/* Info card */}
//         <GlassCard 
//           borderRadius={24} 
//           intensity="medium" 
//           style={{ marginBottom: 40, borderColor: `${accent.coral}44`, borderWidth: 1 }}
//         >
//           <View style={{ alignItems: 'center' }}>
//             <Ionicons name="alert-circle" size={48} color={accent.coral} style={{ marginBottom: 12 }} />
//             <Text style={[Type.body, { color: colors.textPrimary, textAlign: 'center', marginBottom: 8 }]}>
//               Press the button below to send an emergency alert
//             </Text>
//             <Text style={[Type.caption, { color: colors.textMuted, textAlign: 'center' }]}>
//               Your location will be shared with your accepted emergency contacts
//             </Text>
//           </View>
//         </GlassCard>

//         {/* Large SOS Button */}
//         <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
//           <TouchableOpacity
//             onPress={triggerSOS}
//             disabled={triggering}
//             activeOpacity={0.8}
//             style={[
//               styles.sosButton,
//               { backgroundColor: accent.coral, opacity: triggering ? 0.6 : 1 },
//             ]}
//           >
//             <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: 0.3 }]} />
//             <Ionicons name="alert" size={60} color="#fff" />
//             <Text style={[Type.section, { color: '#fff', marginTop: 12 }]}>SOS</Text>
//           </TouchableOpacity>
//         </Animated.View>

//         {/* Last SOS info */}
//         {lastSOS && (
//           <View style={{ marginTop: 40 }}>
//             <Text style={[Type.caption, { color: colors.textMuted, textAlign: 'center' }]}>
//               Last SOS sent: {lastSOS.toLocaleTimeString()}
//             </Text>
//           </View>
//         )}

//         {/* Warning */}
//         <View
//           style={[
//             styles.warningBox,
//             {
//               backgroundColor: `${accent.coral}11`,
//               borderColor: `${accent.coral}44`,
//               marginTop: 40,
//             },
//           ]}
//         >
//           <Ionicons name="information-circle" size={20} color={accent.coral} style={{ marginRight: 10 }} />
//           <Text style={[Type.caption, { color: colors.textMuted, flex: 1 }]}>
//             Only accepted emergency contacts will receive SOS alerts.
//           </Text>
//         </View>
//       </View>

//       {/* Bottom info */}
//       <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20, alignItems: 'center' }}>
//         <Text style={[Type.caption, { color: colors.textMuted, marginBottom: 4 }]}>
//           Logged in as
//         </Text>
//         <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
//           {user?.username}
//         </Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1 },
//   glow: {
//     position: 'absolute',
//     top: '20%',
//     left: '50%',
//     width: 300,
//     height: 300,
//     borderRadius: 300,
//     opacity: 0.08,
//     marginLeft: -150,
//   },
//   sosButton: {
//     width: 160,
//     height: 160,
//     borderRadius: 80,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//   },
//   pulseRing: {
//     position: 'absolute',
//     width: 160,
//     height: 160,
//     borderRadius: 80,
//     borderWidth: 3,
//     borderColor: '#FF6B6B',
//   },
//   warningBox: {
//     flexDirection: 'row',
//     padding: 14,
//     borderRadius: 12,
//     borderWidth: 1,
//     alignItems: 'center',
//   },
// });
