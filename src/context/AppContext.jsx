import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { storage, KEYS } from '../storage/storage'
import { INITIAL_DATA } from '../data/initialData'

const AppContext = createContext()

export function AppProvider({ children }) {
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
    async function load() {
      const [p, i, gi, gu, pr, o, w, a, b, t] = await Promise.all([
        storage.get(KEYS.phases, INITIAL_DATA.phases),
        storage.get(KEYS.items, INITIAL_DATA.items),
        storage.get(KEYS.gifts, INITIAL_DATA.gifts),
        storage.get(KEYS.guests, INITIAL_DATA.guests),
        storage.get(KEYS.professionals, INITIAL_DATA.professionals),
        storage.get(KEYS.orders, INITIAL_DATA.orders),
        storage.get(KEYS.warranties, INITIAL_DATA.warranties),
        storage.get(KEYS.appointments, INITIAL_DATA.appointments),
        storage.get(KEYS.budget, INITIAL_DATA.budget),
        storage.get(KEYS.timeline, INITIAL_DATA.timeline),
      ])
      setPhases(p)
      setItems(i)
      setGifts(gi)
      setGuests(gu)
      setProfessionals(pr)
      setOrders(o)
      setWarranties(w)
      setAppointments(a)
      setBudget(b)
      setTimeline(t)
      setLoaded(true)
    }
    load()
  }, [])

  const savePhases = (v) => { setPhases(v); storage.set(KEYS.phases, v) }
  const saveItems = (v) => { setItems(v); storage.set(KEYS.items, v) }
  const saveGifts = (v) => { setGifts(v); storage.set(KEYS.gifts, v) }
  const saveGuests = (v) => { setGuests(v); storage.set(KEYS.guests, v) }
  const saveProfessionals = (v) => { setProfessionals(v); storage.set(KEYS.professionals, v) }
  const saveOrders = (v) => { setOrders(v); storage.set(KEYS.orders, v) }
  const saveWarranties = (v) => { setWarranties(v); storage.set(KEYS.warranties, v) }
  const saveAppointments = (v) => { setAppointments(v); storage.set(KEYS.appointments, v) }
  const saveBudget = (v) => { setBudget(v); storage.set(KEYS.budget, v) }
  const saveTimeline = (v) => { setTimeline(v); storage.set(KEYS.timeline, v) }

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

  const resetToInitial = async () => {
    await AsyncStorage.multiRemove(Object.values(KEYS))
    setPhases(INITIAL_DATA.phases)
    setItems(INITIAL_DATA.items)
    setGifts(INITIAL_DATA.gifts)
    setGuests(INITIAL_DATA.guests)
    setProfessionals(INITIAL_DATA.professionals)
    setOrders(INITIAL_DATA.orders)
    setWarranties(INITIAL_DATA.warranties)
    setAppointments(INITIAL_DATA.appointments)
    setBudget(INITIAL_DATA.budget)
    setTimeline(INITIAL_DATA.timeline)
  }

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <AppContext.Provider value={{
      phases, items, gifts, guests, professionals,
      orders, warranties, appointments, budget, timeline,
      loaded, toast,
      savePhases, saveItems, saveGifts, saveGuests, saveProfessionals,
      saveOrders, saveWarranties, saveAppointments, saveBudget, saveTimeline,
      updatePhaseItem, addPhaseItem, deletePhaseItem,
      showToast, resetToInitial,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
