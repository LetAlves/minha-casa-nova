import React from 'react'
import { View, TouchableOpacity, Text } from 'react-native'

export default function StarRating({ value = 0, onChange, size = 20 }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity key={i} onPress={() => onChange?.(i)} disabled={!onChange}>
          <Text style={{ fontSize: size, color: i <= value ? '#F59E0B' : '#D1D5DB' }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
