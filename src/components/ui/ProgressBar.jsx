import React from 'react'
import { View, Text } from 'react-native'

export default function ProgressBar({ value = 0, color = '#C9A84C', label, showPercent = true, height = 8 }) {
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <View>
      {(label || showPercent) && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          {label ? <Text style={{ fontSize: 12, color: '#6B7280' }}>{label}</Text> : <View />}
          {showPercent && <Text style={{ fontSize: 12, fontWeight: '700', color }}>{pct}%</Text>}
        </View>
      )}
      <View style={{ height, backgroundColor: '#E5E7EB', borderRadius: height / 2, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height, backgroundColor: color, borderRadius: height / 2 }} />
      </View>
    </View>
  )
}
