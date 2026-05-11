import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { storage, KEYS } from '../storage/storage'
import { INITIAL_DATA } from '../data/initialData'
import { auth, db, FIREBASE_CONFIGURED } from '../firebase/config'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'

const AppContext = createContext()

const fsKey = (key) => key.replace('cn:', '')

const syncToCloud = async (uid, key, value) => {
  if (!FIREBASE_CONFIGURED || !uid || !db) return
  try {
    await setDoc(doc(db, 'users', uid, 'data', fsKey(key)), { value })
  } catch (e) {
    console.log('[Firebase] sync error:', e.message)
  }
}

const loadFromCloud = async (uid, key) => {
  if (!FIREBASE_CONFIGURED || !uid || !db) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'data', fsKey(key)))
    return snap.exists() ? snap.data().value : null
  } catch (e) {
    console.log('[Firebase] load error:', e.message)
    return null
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(FIREBASE_CONFIGURED)

  const [phases, setPhases] = useState(INITIAL_DATA.phases)
  const [items, setItems] = useState(INITIAL_DATA.items)
  const [gifts, setGifts] = useState(INITIAL_DATA.gifts)
  const [guests, setGuests] = useState(INITIAL_DATA.guests)
  const [professionals, setProfessionals] = useState(INITIAL_DATA.professionals)
  const [orders, setOrders] = useState(INITIAL_DATA.orders)
  const [warranties, setWarranties] = useState(INITIAL_DATA.warranties)
  const [appointments, setAppointments] = useState(INITIAL_DATA.appointments)
  const [budget, setBudget] = useState(INITIAL_DATA.budget)
  const [timeline, setTimeline] = useState(INITIAL_DATA.timeline)
  const [toast, setToast] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!FIREBASE_CONFIGURED) return
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (authLoading) return

    let cancelled = false

    async function load() {
      setLoaded(false)
      const allKeys = Object.values(KEYS)
      const defaults = [
        INITIAL_DATA.phases, INITIAL_DATA.items, INITIAL_DATA.gifts,
        INITIAL_DATA.guests, INITIAL_DATA.professionals, INITIAL_DATA.orders,
        INITIAL_DATA.warranties, INITIAL_DATA.appointments, INITIAL_DATA.budget,
        INITIAL_DATA.timeline,
      ]

      let values

      if (user) {
        const cloudResults = await Promise.all(allKeys.map(k => loadFromCloud(user.uid, k)))
        const hasCloudData = cloudResults[0] !== null

        if (!hasCloudData) {
          // Primeira vez — carrega do AsyncStorage e sobe para a nuvem
          const local = await Promise.all(allKeys.map((k, idx) => storage.get(k, defaults[idx])))
          values = local
          await Promise.all(local.map((v, idx) => syncToCloud(user.uid, allKeys[idx], v)))
        } else {
          values = cloudResults.map((v, idx) => v ?? defaults[idx])
        }
      } else {
        values = await Promise.all(allKeys.map((k, idx) => storage.get(k, defaults[idx])))
      }

      if (!cancelled) {
        setPhases(values[0])
        setItems(values[1])
        setGifts(values[2])
        setGuests(values[3])
        setProfessionals(values[4])
        setOrders(values[5])
        setWarranties(values[6])
        setAppointments(values[7])
        setBudget(values[8])
        setTimeline(values[9])
        setLoaded(true)
      }
    }

    load()
    return () => { cancelled = true }
  }, [authLoading, user?.uid])

  const makeSave = (setter, key) => (v) => {
    setter(v)
    storage.set(key, v)
    if (user) syncToCloud(user.uid, key, v)
  }

  const savePhases = makeSave(setPhases, KEYS.phases)
  const saveItems = makeSave(setItems, KEYS.items)
  const saveGifts = makeSave(setGifts, KEYS.gifts)
  const saveGuests = makeSave(setGuests, KEYS.guests)
  const saveProfessionals = makeSave(setProfessionals, KEYS.professionals)
  const saveOrders = makeSave(setOrders, KEYS.orders)
  const saveWarranties = makeSave(setWarranties, KEYS.warranties)
  const saveAppointments = makeSave(setAppointments, KEYS.appointments)
  const saveBudget = makeSave(setBudget, KEYS.budget)
  const saveTimeline = makeSave(setTimeline, KEYS.timeline)

  const updatePhaseItem = (phaseId, itemId, updates) => {
    const updated = phases.map(ph =>
      ph.id === phaseId
        ? { ...ph, items: ph.items.map(it => it.id === itemId ? { ...it, ...updates } : it) }
        : ph
    )
    savePhases(updated)
  }

  const addPhaseItem = (phaseId, item) => {
    const updated = phases.map(ph =>
      ph.id === phaseId ? { ...ph, items: [...ph.items, item] } : ph
    )
    savePhases(updated)
  }

  const deletePhaseItem = (phaseId, itemId) => {
    const updated = phases.map(ph =>
      ph.id === phaseId ? { ...ph, items: ph.items.filter(it => it.id !== itemId) } : ph
    )
    savePhases(updated)
  }

  const syncAllToFirestore = async (uid) => {
    if (!FIREBASE_CONFIGURED) return
    const targetUid = uid || user?.uid
    if (!targetUid) return
    const allKeys = Object.values(KEYS)
    const allValues = [phases, items, gifts, guests, professionals, orders, warranties, appointments, budget, timeline]
    await Promise.all(allValues.map((v, idx) => syncToCloud(targetUid, allKeys[idx], v)))
  }

  const resetToInitial = async () => {
    await AsyncStorage.multiRemove(Object.values(KEYS))
    const defaults = [
      INITIAL_DATA.phases, INITIAL_DATA.items, INITIAL_DATA.gifts,
      INITIAL_DATA.guests, INITIAL_DATA.professionals, INITIAL_DATA.orders,
      INITIAL_DATA.warranties, INITIAL_DATA.appointments, INITIAL_DATA.budget,
      INITIAL_DATA.timeline,
    ]
    setPhases(defaults[0]); setItems(defaults[1]); setGifts(defaults[2])
    setGuests(defaults[3]); setProfessionals(defaults[4]); setOrders(defaults[5])
    setWarranties(defaults[6]); setAppointments(defaults[7])
    setBudget(defaults[8]); setTimeline(defaults[9])
    if (user) {
      const allKeys = Object.values(KEYS)
      await Promise.all(defaults.map((v, idx) => syncToCloud(user.uid, allKeys[idx], v)))
    }
  }

  const logout = async () => {
    if (!FIREBASE_CONFIGURED || !auth) return
    try { await signOut(auth) } catch (e) { console.log('Logout error:', e) }
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <AppContext.Provider value={{
      phases, items, gifts, guests, professionals,
      orders, warranties, appointments, budget, timeline,
      loaded, toast, user, authLoading,
      savePhases, saveItems, saveGifts, saveGuests, saveProfessionals,
      saveOrders, saveWarranties, saveAppointments, saveBudget, saveTimeline,
      updatePhaseItem, addPhaseItem, deletePhaseItem,
      showToast, resetToInitial, syncAllToFirestore, logout,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
