import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

export default function SOSScreen() {
  return (
    <View>
      <Text>SOSScreen</Text>
    </View>
  )
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 14, color: '#666', marginTop: 8 },
  });