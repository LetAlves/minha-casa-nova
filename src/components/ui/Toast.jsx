import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useApp } from '../../context/AppContext'

export default function Toast() {
  const { toast } = useApp()
  if (!toast) return null
  const bg = toast.type === 'error' ? '#EF4444' : toast.type === 'info' ? '#3B82F6' : '#22C55E'
  return (
    <View style={[s.container, { backgroundColor: bg }]}>
      <Text style={s.text}>{toast.message}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    borderRadius: 12,
    padding: 14,
    elevation: 10,
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
})
