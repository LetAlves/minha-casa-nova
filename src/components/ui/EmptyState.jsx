import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default function EmptyState({ icon = '📭', title, message, actionLabel, onAction }) {
  return (
    <View style={s.container}>
      <Text style={s.icon}>{icon}</Text>
      <Text style={s.title}>{title}</Text>
      {message ? <Text style={s.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity style={s.btn} onPress={onAction}>
          <Text style={s.btnTxt}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  icon: { fontSize: 52, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: '700', color: '#1F2937', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 20, backgroundColor: '#C9A84C', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
