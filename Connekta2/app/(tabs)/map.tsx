import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router';

export default function MapScreen() {
  return (
    <View>
      <Text>MapScreen</Text>
      <Link href="/(tabs)/settings" >Go to settings</Link>
      <Link href="/(tabs)/settings/profile" >Go to profile</Link>
    </View>
  )
}
