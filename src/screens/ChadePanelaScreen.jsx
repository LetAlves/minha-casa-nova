import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  TextInput, ActivityIndicator, Share, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import BaseModal from '../components/modals/BaseModal'
import EmptyState from '../components/ui/EmptyState'
import { formatCurrency } from '../utils/dates'

const GIFT_TYPES = [
  { value: 'presente', label: 'A ganhar' },
  { value: 'comprar', label: 'Vou comprar' },
]

const CATEGORIES = ['Cozinha', 'Sala', 'Quarto', 'Banheiro', 'Área de Lazer', 'Área de Serviço', 'Outros']

const GIFT_FILTER_OPTIONS = [
  { label: 'Todos', value: 'todos' },
  { label: 'A ganhar', value: 'presente' },
  { label: 'Vou comprar', value: 'comprar' },
  { label: 'Recebidos', value: 'recebidos' },
]

const CONFIRM_STATUS = [null, true, false]

function cycleConfirm(current) {
  if (current === null) return true
  if (current === true) return false
  return null
}

function confirmIcon(confirmed) {
  if (confirmed === true) return { icon: '✅', color: '#22C55E' }
  if (confirmed === false) return { icon: '❌', color: '#EF4444' }
  return { icon: '❓', color: '#F59E0B' }
}

export default function ChadePanelaScreen() {
  const { gifts, guests, saveGifts, saveGuests, showToast, loaded } = useApp()

  const [activeTab, setActiveTab] = useState(0) // 0: Presentes, 1: Convidados
  const [giftFilter, setGiftFilter] = useState('todos')
  const [categoryFilter, setCategoryFilter] = useState('Todos')
  const [addGiftModal, setAddGiftModal] = useState(false)
  const [editGiftModal, setEditGiftModal] = useState(false)
  const [addGuestModal, setAddGuestModal] = useState(false)
  const [linkGiftModal, setLinkGiftModal] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState(null)
  const [editingGift, setEditingGift] = useState(null)
  const [giftForm, setGiftForm] = useState({ name: '', category: 'Cozinha', estimatedValue: '', type: 'presente' })
  const [editGiftForm, setEditGiftForm] = useState({ name: '', category: 'Cozinha', estimatedValue: '', type: 'presente' })
  const [guestForm, setGuestForm] = useState({ name: '', contact: '' })

  if (!loaded) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color="#E07A5F" style={{ marginTop: 80 }} />
      </SafeAreaView>
    )
  }

  // Gift stats
  const totalGifts = gifts.length
  const reservedCount = gifts.filter(g => g.reservedBy).length
  const receivedCount = gifts.filter(g => g.received).length
  const totalValue = gifts.reduce((sum, g) => sum + (g.estimatedValue || 0), 0)

  // Guest stats
  const totalGuests = guests.length
  const confirmedGuests = guests.filter(g => g.confirmed === true).length
  const declinedGuests = guests.filter(g => g.confirmed === false).length
  const awaitingGuests = guests.filter(g => g.confirmed === null).length

  const filteredGifts = gifts.filter(g => {
    const typeOk = giftFilter === 'todos' ? true
      : giftFilter === 'presente' ? g.type === 'presente' && !g.received
      : giftFilter === 'comprar' ? g.type === 'comprar'
      : giftFilter === 'recebidos' ? g.received
      : true
    const catOk = categoryFilter === 'Todos' || g.category === categoryFilter
    return typeOk && catOk
  })

  const handleToggleReceived = (gift) => {
    saveGifts(gifts.map(g => g.id === gift.id ? { ...g, received: !g.received } : g))
    showToast(gift.received ? 'Marcado como não recebido.' : 'Presente recebido! 🎉')
  }

  const handleDeleteGift = (gift) => {
    Alert.alert('Excluir', `Deseja excluir "${gift.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: () => {
          saveGifts(gifts.filter(g => g.id !== gift.id))
          // Remove link from guest
          saveGuests(guests.map(gu => gu.giftId === gift.id ? { ...gu, giftId: '' } : gu))
          showToast('Presente excluído.', 'info')
        }
      },
    ])
  }

  const handleOpenEditGift = (gift) => {
    setEditingGift(gift)
    setEditGiftForm({ name: gift.name, category: gift.category, estimatedValue: String(gift.estimatedValue || ''), type: gift.type })
    setEditGiftModal(true)
  }

  const handleSaveEditGift = () => {
    if (!editGiftForm.name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do presente.')
      return
    }
    saveGifts(gifts.map(g => g.id === editingGift.id
      ? { ...g, name: editGiftForm.name, category: editGiftForm.category, estimatedValue: parseFloat(editGiftForm.estimatedValue) || 0, type: editGiftForm.type }
      : g
    ))
    showToast('Presente atualizado!')
    setEditGiftModal(false)
    setEditingGift(null)
  }

  const handleAddGift = () => {
    if (!giftForm.name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do presente.')
      return
    }
    const newGift = {
      id: `g_${Date.now()}`,
      name: giftForm.name,
      category: giftForm.category,
      estimatedValue: parseFloat(giftForm.estimatedValue) || 0,
      type: giftForm.type,
      reservedBy: '',
      received: false,
    }
    saveGifts([...gifts, newGift])
    showToast('Presente adicionado!')
    setAddGiftModal(false)
    setGiftForm({ name: '', category: 'Cozinha', estimatedValue: '', type: 'presente' })
  }

  const handleAddGuest = () => {
    if (!guestForm.name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do convidado.')
      return
    }
    const newGuest = {
      id: `gu_${Date.now()}`,
      name: guestForm.name,
      contact: guestForm.contact,
      confirmed: null,
      giftId: '',
    }
    saveGuests([...guests, newGuest])
    showToast('Convidado adicionado!')
    setAddGuestModal(false)
    setGuestForm({ name: '', contact: '' })
  }

  const handleDeleteGuest = (guest) => {
    Alert.alert('Excluir', `Deseja excluir "${guest.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: () => {
          saveGuests(guests.filter(g => g.id !== guest.id))
          // If guest had a gift linked, unlink
          if (guest.giftId) {
            saveGifts(gifts.map(g => g.id === guest.giftId ? { ...g, reservedBy: '' } : g))
          }
          showToast('Convidado excluído.', 'info')
        }
      },
    ])
  }

  const handleCycleConfirm = (guest) => {
    const newStatus = cycleConfirm(guest.confirmed)
    saveGuests(guests.map(g => g.id === guest.id ? { ...g, confirmed: newStatus } : g))
  }

  const handleLinkGift = (gift) => {
    // Unlink previous gift if guest had one
    if (selectedGuest.giftId) {
      saveGifts(gifts.map(g => g.id === selectedGuest.giftId ? { ...g, reservedBy: '' } : g))
    }
    // Link new gift
    saveGuests(guests.map(g => g.id === selectedGuest.id ? { ...g, giftId: gift.id } : g))
    saveGifts(gifts.map(g => g.id === gift.id ? { ...g, reservedBy: selectedGuest.name } : g))
    setLinkGiftModal(false)
    setSelectedGuest(null)
    showToast(`${gift.name} vinculado a ${selectedGuest.name}!`)
  }

  const handleUnlinkGift = (guest) => {
    saveGuests(guests.map(g => g.id === guest.id ? { ...g, giftId: '' } : g))
    if (guest.giftId) {
      saveGifts(gifts.map(g => g.id === guest.giftId ? { ...g, reservedBy: '' } : g))
    }
    showToast('Presente desvinculado.', 'info')
  }

  const handleShareList = async () => {
    const unreserved = gifts.filter(g => !g.reservedBy && !g.received && g.type === 'presente')
    if (unreserved.length === 0) {
      Alert.alert('Lista vazia', 'Todos os presentes já foram reservados!')
      return
    }
    const text = ['🎁 Lista de Presentes — Chá de Panela\n',
      ...unreserved.map(g => `• ${g.name} (${g.category}) — ${formatCurrency(g.estimatedValue)}`),
    ].join('\n')
    try {
      await Share.share({ message: text })
    } catch (e) {
      Alert.alert('Erro', 'Não foi possível compartilhar a lista.')
    }
  }

  const getGiftName = (giftId) => {
    const gift = gifts.find(g => g.id === giftId)
    return gift ? gift.name : ''
  }

  const availableGifts = gifts.filter(g => !g.reservedBy || g.id === (selectedGuest?.giftId || ''))

  const renderGiftCard = ({ item: gift }) => (
    <View style={s.card}>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
            <View style={[s.catChip, { backgroundColor: gift.type === 'comprar' ? '#EDE9FE' : '#FEF3C7' }]}>
              <Text style={[s.catChipTxt, { color: gift.type === 'comprar' ? '#7C3AED' : '#D97706' }]}>{gift.category}</Text>
            </View>
            {gift.type === 'comprar' && (
              <View style={[s.catChip, { backgroundColor: '#DBEAFE' }]}>
                <Text style={[s.catChipTxt, { color: '#1D4ED8' }]}>Vou comprar</Text>
              </View>
            )}
          </View>
          <Text style={s.itemName}>{gift.name}</Text>
          <Text style={s.itemValue}>{formatCurrency(gift.estimatedValue)}</Text>
          {gift.reservedBy ? <Text style={s.reservedTxt}>Reservado por: {gift.reservedBy}</Text> : null}
        </View>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => handleToggleReceived(gift)} style={s.heartBtn}>
            <Text style={{ fontSize: 26, color: gift.received ? '#EF4444' : '#D1D5DB' }}>
              {gift.received ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleOpenEditGift(gift)}>
            <Ionicons name="pencil-outline" size={18} color="#E07A5F" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteGift(gift)}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )

  const renderGuestCard = ({ item: guest }) => {
    const { icon, color } = confirmIcon(guest.confirmed)
    const linkedGift = getGiftName(guest.giftId)
    return (
      <View style={s.card}>
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.itemName}>{guest.name}</Text>
            {guest.contact ? <Text style={s.itemMeta}>📞 {guest.contact}</Text> : null}
            {linkedGift ? (
              <Text style={s.itemMeta}>🎁 {linkedGift}</Text>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            <TouchableOpacity onPress={() => handleCycleConfirm(guest)} style={[s.confirmBtn, { borderColor: color }]}>
              <Text style={{ fontSize: 18 }}>{icon}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
          <TouchableOpacity
            style={[s.guestActionBtn, { backgroundColor: '#F3F4F6' }]}
            onPress={() => { setSelectedGuest(guest); setLinkGiftModal(true) }}
          >
            <Ionicons name="gift-outline" size={14} color="#6B7280" />
            <Text style={{ color: '#6B7280', fontWeight: '700', fontSize: 12 }}>
              {guest.giftId ? 'Trocar presente' : 'Vincular presente'}
            </Text>
          </TouchableOpacity>
          {guest.giftId ? (
            <TouchableOpacity style={[s.guestActionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleUnlinkGift(guest)}>
              <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
              <Text style={{ color: '#DC2626', fontWeight: '700', fontSize: 12 }}>Desvincular</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={[s.guestActionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => handleDeleteGuest(guest)}>
            <Ionicons name="trash-outline" size={14} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🎁 Chá de Panela</Text>
      </View>
      {/* Main tabs */}
      <View style={s.mainTabRow}>
        <TouchableOpacity style={[s.mainTab, activeTab === 0 && s.mainTabActive]} onPress={() => setActiveTab(0)}>
          <Text style={[s.mainTabTxt, activeTab === 0 && s.mainTabTxtActive]}>🎁 Presentes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.mainTab, activeTab === 1 && s.mainTabActive]} onPress={() => setActiveTab(1)}>
          <Text style={[s.mainTabTxt, activeTab === 1 && s.mainTabTxtActive]}>👥 Convidados</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 0 ? (
        <>
          {/* Gift stats */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statVal}>{totalGifts}</Text>
              <Text style={s.statLbl}>Total</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statVal}>{reservedCount}</Text>
              <Text style={s.statLbl}>Reservados</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statVal}>{receivedCount}</Text>
              <Text style={s.statLbl}>Recebidos</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { fontSize: 12 }]}>{formatCurrency(totalValue)}</Text>
              <Text style={s.statLbl}>Total</Text>
            </View>
          </View>

          {/* Filtro por status */}
          <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 50 }} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', height: 50 }}>
              {GIFT_FILTER_OPTIONS.map(f => (
                <TouchableOpacity key={f.value} style={[s.chip(giftFilter === f.value), { marginRight: 8 }]} onPress={() => setGiftFilter(f.value)}>
                  <Text style={s.chipTxt(giftFilter === f.value)}>{f.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Filtro por cômodo */}
          <View style={{ backgroundColor: '#FAF7F2', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 50 }} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', height: 50 }}>
              {['Todos', ...CATEGORIES].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[s.roomChip(categoryFilter === cat), { marginRight: 8 }]}
                  onPress={() => setCategoryFilter(cat)}
                >
                  <Text style={s.roomChipTxt(categoryFilter === cat)}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <FlatList
            data={filteredGifts}
            keyExtractor={item => item.id}
            renderItem={renderGiftCard}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }}
            ListEmptyComponent={<EmptyState icon="🎁" title="Nenhum presente aqui" message="Adicione presentes à sua lista." />}
          />

          {/* Share button */}
          <TouchableOpacity style={s.shareBtn} onPress={handleShareList}>
            <Ionicons name="share-outline" size={18} color="#fff" />
            <Text style={s.shareBtnTxt}>Compartilhar Lista</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.fab} onPress={() => setAddGiftModal(true)}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Guest stats */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <Text style={s.statVal}>{totalGuests}</Text>
              <Text style={s.statLbl}>Total</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: '#22C55E' }]}>{confirmedGuests}</Text>
              <Text style={s.statLbl}>Confirmados</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: '#EF4444' }]}>{declinedGuests}</Text>
              <Text style={s.statLbl}>Declinaram</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statVal, { color: '#F59E0B' }]}>{awaitingGuests}</Text>
              <Text style={s.statLbl}>Aguardando</Text>
            </View>
          </View>

          <FlatList
            data={guests}
            keyExtractor={item => item.id}
            renderItem={renderGuestCard}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 100 }}
            ListEmptyComponent={<EmptyState icon="👥" title="Nenhum convidado" message="Adicione os convidados do chá de panela." />}
          />

          <TouchableOpacity style={s.fab} onPress={() => setAddGuestModal(true)}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* Edit gift modal */}
      <BaseModal visible={editGiftModal} onClose={() => { setEditGiftModal(false); setEditingGift(null) }} title="Editar Presente">
        <View style={{ paddingBottom: 20 }}>
          <Text style={s.label}>Nome *</Text>
          <TextInput style={s.input} value={editGiftForm.name} onChangeText={v => setEditGiftForm(f => ({ ...f, name: v }))} placeholder="Ex: Jogo de panelas" placeholderTextColor="#9CA3AF" autoCorrect={false} />

          <Text style={s.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} keyboardShouldPersistTaps="always">
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[s.chip(editGiftForm.category === c), { marginRight: 6 }]} onPress={() => setEditGiftForm(f => ({ ...f, category: c }))}>
                <Text style={s.chipTxt(editGiftForm.category === c)}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.label}>Valor Estimado (R$)</Text>
          <TextInput style={s.input} value={editGiftForm.estimatedValue} onChangeText={v => setEditGiftForm(f => ({ ...f, estimatedValue: v }))} placeholder="0,00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />

          <Text style={s.label}>Tipo</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {GIFT_TYPES.map(t => (
              <TouchableOpacity key={t.value} style={[s.chip(editGiftForm.type === t.value), { flex: 1, alignItems: 'center' }]} onPress={() => setEditGiftForm(f => ({ ...f, type: t.value }))}>
                <Text style={s.chipTxt(editGiftForm.type === t.value)}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={handleSaveEditGift}>
            <Text style={s.saveBtnTxt}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>

      {/* Add gift modal */}
      <BaseModal visible={addGiftModal} onClose={() => setAddGiftModal(false)} title="Novo Presente">
        <View style={{ paddingBottom: 20 }}>
          <Text style={s.label}>Nome *</Text>
          <TextInput style={s.input} value={giftForm.name} onChangeText={v => setGiftForm(f => ({ ...f, name: v }))} placeholder="Ex: Jogo de panelas" placeholderTextColor="#9CA3AF" />

          <Text style={s.label}>Categoria</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[s.chip(giftForm.category === c), { marginRight: 6 }]} onPress={() => setGiftForm(f => ({ ...f, category: c }))}>
                <Text style={s.chipTxt(giftForm.category === c)}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={s.label}>Valor Estimado (R$)</Text>
          <TextInput style={s.input} value={giftForm.estimatedValue} onChangeText={v => setGiftForm(f => ({ ...f, estimatedValue: v }))} placeholder="0,00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />

          <Text style={s.label}>Tipo</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {GIFT_TYPES.map(t => (
              <TouchableOpacity key={t.value} style={[s.chip(giftForm.type === t.value), { flex: 1, alignItems: 'center' }]} onPress={() => setGiftForm(f => ({ ...f, type: t.value }))}>
                <Text style={s.chipTxt(giftForm.type === t.value)}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={handleAddGift}>
            <Text style={s.saveBtnTxt}>Adicionar Presente</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>

      {/* Add guest modal */}
      <BaseModal visible={addGuestModal} onClose={() => setAddGuestModal(false)} title="Novo Convidado">
        <View style={{ paddingBottom: 20 }}>
          <Text style={s.label}>Nome *</Text>
          <TextInput style={s.input} value={guestForm.name} onChangeText={v => setGuestForm(f => ({ ...f, name: v }))} placeholder="Ex: João e Maria" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Contato</Text>
          <TextInput style={s.input} value={guestForm.contact} onChangeText={v => setGuestForm(f => ({ ...f, contact: v }))} placeholder="(11) 99999-0000" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
          <TouchableOpacity style={s.saveBtn} onPress={handleAddGuest}>
            <Text style={s.saveBtnTxt}>Adicionar Convidado</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>

      {/* Link gift modal */}
      <BaseModal visible={linkGiftModal} onClose={() => { setLinkGiftModal(false); setSelectedGuest(null) }} title="Vincular Presente">
        <View style={{ paddingBottom: 20 }}>
          {selectedGuest && <Text style={[s.label, { marginBottom: 12 }]}>Convidado: {selectedGuest.name}</Text>}
          {availableGifts.length === 0 ? (
            <EmptyState icon="🎁" title="Nenhum presente disponível" message="Todos os presentes já foram reservados." />
          ) : (
            availableGifts.map(gift => (
              <TouchableOpacity key={gift.id} style={[s.card, { marginBottom: 8 }]} onPress={() => handleLinkGift(gift)}>
                <Text style={s.itemName}>{gift.name}</Text>
                <Text style={s.itemMeta}>{gift.category} · {formatCurrency(gift.estimatedValue)}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </BaseModal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#3D405B' },
  mainTabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  mainTab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  mainTabActive: { borderBottomWidth: 3, borderBottomColor: '#E07A5F' },
  mainTabTxt: { fontSize: 14, fontWeight: '700', color: '#9CA3AF' },
  mainTabTxtActive: { color: '#E07A5F' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#fff' },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: '#FAF7F2', borderRadius: 10, paddingVertical: 8, elevation: 1 },
  statVal: { fontSize: 15, fontWeight: '800', color: '#E07A5F' },
  statLbl: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  itemMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemValue: { fontSize: 14, fontWeight: '700', color: '#E07A5F', marginTop: 2 },
  reservedTxt: { fontSize: 12, color: '#22C55E', fontWeight: '700', marginTop: 4 },
  catChip: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  catChipTxt: { fontSize: 11, fontWeight: '700' },
  confirmBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  heartBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  guestActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, flex: 1, justifyContent: 'center' },
  chip: (active) => ({ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? '#E07A5F' : '#F3F4F6' }),
  chipTxt: (active) => ({ color: active ? '#fff' : '#6B7280', fontWeight: '700', fontSize: 13 }),
  roomChip: (active) => ({ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: active ? '#3D405B' : '#EDE9FE' }),
  roomChipTxt: (active) => ({ color: active ? '#fff' : '#3D405B', fontWeight: '700', fontSize: 12 }),
  label: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#1F2937', backgroundColor: '#FAFAFA', marginBottom: 12 },
  saveBtn: { backgroundColor: '#E07A5F', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  fab: { position: 'absolute', bottom: 22, right: 22, width: 58, height: 58, borderRadius: 29, backgroundColor: '#E07A5F', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  shareBtn: { position: 'absolute', bottom: 90, right: 22, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3D405B', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, elevation: 5 },
  shareBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
})
