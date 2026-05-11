import AsyncStorage from '@react-native-async-storage/async-storage'

export const KEYS = {
  phases: 'cn:phases',
  items: 'cn:items',
  gifts: 'cn:gifts',
  guests: 'cn:guests',
  professionals: 'cn:professionals',
  orders: 'cn:orders',
  warranties: 'cn:warranties',
  appointments: 'cn:appointments',
  budget: 'cn:budget',
  timeline: 'cn:timeline',
}

export const storage = {
  get: async (key, fallback) => {
    try {
      const val = await AsyncStorage.getItem(key)
      return val ? JSON.parse(val) : fallback
    } catch {
      return fallback
    }
  },
  set: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value))
    } catch {}
  },
}
