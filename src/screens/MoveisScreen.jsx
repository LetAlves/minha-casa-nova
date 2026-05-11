import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  TextInput, Image, ActivityIndicator, ScrollView, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useApp } from '../context/AppContext'
import Badge from '../components/ui/Badge'
import BaseModal from '../components/modals/BaseModal'
import EmptyState from '../components/ui/EmptyState'
import { formatCurrency } from '../utils/dates'

const ROOMS = ['Todos', 'Sala', 'Quarto', 'Cozinha', 'Banheiro', 'Escritório', 'Área de Serviço']
const PHASES = ['Todos', 'Fase 5', 'Fase 6', 'Fase 7']
const PRIORITY_OPTIONS = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
]
const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'pesquisando', label: 'Pesquisando' },
  { value: 'comprado', label: 'Comprado' },
  { value: 'entregue', label: 'Entregue' },
]
const PHASE_OPTIONS = [
  { value: 5, label: 'Fase 5 — Móveis' },
  { value: 6, label: 'Fase 6 — Eletros' },
  { value: 7, label: 'Fase 7 — Decoração' },
]
const EMPTY_FORM = {
  name: '', room: 'Sala', phase: 5, priority: 'media', status: 'pendente',
  price: '', width: '', height: '', depth: '', notes: '', photos: [], offers: [],
}

function ItemForm({ form, setForm, onSave, onPickImage }) {
  return (
    <View style={{ paddingBottom: 20 }}>
      <Text style={s.label}>Nome *</Text>
      <TextInput
        style={s.input}
        value={form.name}
        onChangeText={v => setForm(f => ({ ...f, name: v }))}
        placeholder="Ex: Sofá 3 lugares"
        placeholderTextColor="#9CA3AF"
        autoCorrect={false}
      />

      <Text style={s.label}>Cômodo</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }} keyboardShouldPersistTaps="always">
        {ROOMS.filter(r => r !== 'Todos').map(r => (
          <TouchableOpacity key={r} style={[s.chip(form.room === r), { marginRight: 6 }]} onPress={() => setForm(f => ({ ...f, room: r }))}>
            <Text style={s.chipTxt(form.room === r)}>{r}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={s.label}>Fase</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {PHASE_OPTIONS.map(p => (
          <TouchableOpacity key={p.value} style={s.chip(form.phase === p.value)} onPress={() => setForm(f => ({ ...f, phase: p.value }))}>
            <Text style={s.chipTxt(form.phase === p.value)}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Prioridade</Text>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
        {PRIORITY_OPTIONS.map(p => (
          <TouchableOpacity key={p.value} style={s.chip(form.priority === p.value)} onPress={() => setForm(f => ({ ...f, priority: p.value }))}>
            <Text style={s.chipTxt(form.priority === p.value)}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Status</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {STATUS_OPTIONS.map(st => (
          <TouchableOpacity key={st.value} style={s.chip(form.status === st.value)} onPress={() => setForm(f => ({ ...f, status: st.value }))}>
            <Text style={s.chipTxt(form.status === st.value)}>{st.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Preço (R$)</Text>
      <TextInput
        style={s.input}
        value={form.price}
        onChangeText={v => setForm(f => ({ ...f, price: v }))}
        placeholder="0,00"
        placeholderTextColor="#9CA3AF"
        keyboardType="decimal-pad"
      />

      <Text style={s.label}>Dimensões (cm) — Largura × Altura × Profundidade</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <TextInput
          style={[s.input, { flex: 1, marginBottom: 0 }]}
          value={form.width}
          onChangeText={v => setForm(f => ({ ...f, width: v }))}
          placeholder="Larg."
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[s.input, { flex: 1, marginBottom: 0 }]}
          value={form.height}
          onChangeText={v => setForm(f => ({ ...f, height: v }))}
          placeholder="Alt."
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
        />
        <TextInput
          style={[s.input, { flex: 1, marginBottom: 0 }]}
          value={form.depth}
          onChangeText={v => setForm(f => ({ ...f, depth: v }))}
          placeholder="Prof."
          placeholderTextColor="#9CA3AF"
          keyboardType="decimal-pad"
        />
      </View>

      <Text style={s.label}>Observações</Text>
      <TextInput
        style={[s.input, { height: 70, textAlignVertical: 'top' }]}
        value={form.notes}
        onChangeText={v => setForm(f => ({ ...f, notes: v }))}
        placeholder="Cor, modelo, observações..."
        placeholderTextColor="#9CA3AF"
        multiline
        autoCorrect={false}
      />

      <Text style={s.label}>Foto</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {form.photos.map((uri, idx) => (
          <TouchableOpacity key={idx} onLongPress={() => setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))}>
            <Image source={{ uri }} style={{ width: 70, height: 70, borderRadius: 8 }} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={onPickImage} style={s.addPhotoBtn}>
          <Ionicons name="camera" size={24} color="#E07A5F" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.saveBtn} onPress={onSave}>
        <Text style={s.saveBtnTxt}>Salvar</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function MoveisScreen() {
  const { items, saveItems, loaded, showToast } = useApp()

  const [roomFilter, setRoomFilter] = useState('Todos')
  const [phaseFilter, setPhaseFilter] = useState('Todos')
  const [expandedItem, setExpandedItem] = useState(null)
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [priceModal, setPriceModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [offerForm, setOfferForm] = useState({ store: '', price: '', shipping: '', link: '' })
  const [roomW, setRoomW] = useState('')
  const [roomL, setRoomL] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  if (!loaded) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color="#E07A5F" style={{ marginTop: 80 }} />
      </SafeAreaView>
    )
  }

  const filteredItems = items.filter(item => {
    if (roomFilter !== 'Todos' && item.room !== roomFilter) return false
    if (phaseFilter !== 'Todos') {
      const p = parseInt(phaseFilter.replace('Fase ', ''))
      if (item.phase !== p) return false
    }
    return true
  })

  const totalPrice = filteredItems.reduce((acc, i) => acc + (i.price || 0), 0)
  const compradoCount = filteredItems.filter(i => i.status === 'comprado' || i.status === 'entregue').length

  const pickImage = async (onPicked) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    })
    if (!result.canceled && result.assets?.[0]) {
      onPicked(result.assets[0].uri)
    }
  }

  const searchPrices = async (query) => {
    if (!query.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const res = await fetch(
        `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(query)}&limit=10`
      )
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch {
      showToast('Não foi possível buscar preços agora.', 'info')
    } finally {
      setSearching(false)
    }
  }

  const openPriceModal = (item) => {
    setEditingItem(item)
    setSearchQuery(item.name)
    setSearchResults([])
    setPriceModal(true)
    searchPrices(item.name)
  }

  const handleAddSearchResult = (result) => {
    const alreadyAdded = (editingItem.offers || []).some(o => o.link === result.permalink)
    if (alreadyAdded) { showToast('Essa oferta já foi adicionada.', 'info'); return }
    const offer = {
      id: `o_${Date.now()}`,
      store: result.seller?.nickname || 'Mercado Livre',
      price: result.price,
      shipping: 0,
      link: result.permalink,
    }
    const updatedItem = { ...editingItem, offers: [...(editingItem.offers || []), offer] }
    saveItems(items.map(i => i.id === editingItem.id ? updatedItem : i))
    setEditingItem(updatedItem)
    showToast('Oferta adicionada!')
  }

  const handleSaveItem = () => {
    if (!form.name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do item.')
      return
    }
    const data = {
      ...form,
      price: parseFloat(String(form.price).replace(',', '.')) || 0,
      width: parseFloat(form.width) || 0,
      height: parseFloat(form.height) || 0,
      depth: parseFloat(form.depth) || 0,
    }
    if (editingItem) {
      saveItems(items.map(i => i.id === editingItem.id ? { ...data, id: i.id } : i))
      showToast('Item atualizado!')
      setEditModal(false)
    } else {
      saveItems([...items, { ...data, id: `m_${Date.now()}` }])
      showToast('Item adicionado!')
      setAddModal(false)
    }
    setForm(EMPTY_FORM)
    setEditingItem(null)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setForm({
      ...item,
      price: String(item.price || ''),
      width: String(item.width || ''),
      height: String(item.height || ''),
      depth: String(item.depth || ''),
    })
    setEditModal(true)
  }

  const handleDelete = (item) => {
    Alert.alert('Excluir', `Deseja excluir "${item.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: () => {
          saveItems(items.filter(i => i.id !== item.id))
          showToast('Item excluído.', 'info')
          setExpandedItem(null)
        },
      },
    ])
  }

  const handleAddOffer = () => {
    if (!offerForm.store.trim() || !offerForm.price) return
    const offer = {
      id: `o_${Date.now()}`,
      store: offerForm.store,
      price: parseFloat(offerForm.price) || 0,
      shipping: parseFloat(offerForm.shipping) || 0,
      link: offerForm.link,
    }
    const updatedItem = { ...editingItem, offers: [...(editingItem.offers || []), offer] }
    saveItems(items.map(i => i.id === editingItem.id ? updatedItem : i))
    setEditingItem(updatedItem)
    setOfferForm({ store: '', price: '', shipping: '', link: '' })
    showToast('Oferta adicionada!')
  }

  const handleDeleteOffer = (offerId) => {
    const updatedItem = { ...editingItem, offers: editingItem.offers.filter(o => o.id !== offerId) }
    saveItems(items.map(i => i.id === editingItem.id ? updatedItem : i))
    setEditingItem(updatedItem)
    showToast('Oferta removida.', 'info')
  }

  const getCheapestOffer = (offers) => {
    if (!offers || offers.length === 0) return null
    return offers.reduce((min, o) => {
      const total = (o.price || 0) + (o.shipping || 0)
      const minTotal = (min.price || 0) + (min.shipping || 0)
      return total < minTotal ? o : min
    }, offers[0])
  }

  const roomTotals = {}
  items.forEach(item => {
    if (!roomTotals[item.room]) roomTotals[item.room] = { total: 0, comprado: 0, count: 0 }
    roomTotals[item.room].total += item.price || 0
    roomTotals[item.room].count += 1
    if (item.status === 'comprado' || item.status === 'entregue') roomTotals[item.room].comprado += 1
  })

  const renderItem = ({ item }) => {
    const isExpanded = expandedItem === item.id
    const cheapest = getCheapestOffer(item.offers)
    const roomWidth = parseFloat(roomW) || 0
    const roomLength = parseFloat(roomL) || 0
    const fits = roomWidth > 0 && roomLength > 0
      ? (item.width <= roomWidth && item.depth <= roomLength)
      : null

    return (
      <TouchableOpacity style={s.card} onPress={() => setExpandedItem(isExpanded ? null : item.id)} activeOpacity={0.8}>
        <View style={s.row}>
          {item.photos && item.photos.length > 0 && (
            <Image source={{ uri: item.photos[0] }} style={{ width: 54, height: 54, borderRadius: 10, marginRight: 10 }} />
          )}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Badge status={item.priority} />
              <View style={s.roomChip}><Text style={s.roomChipTxt}>{item.room}</Text></View>
            </View>
            <Text style={[s.itemName, { marginTop: 4 }]}>{item.name}</Text>
            <Text style={s.itemPrice}>{formatCurrency(item.price)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Badge status={item.status} />
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" style={{ marginTop: 8 }} />
          </View>
        </View>

        {isExpanded && (
          <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 }}>
            {(item.width > 0 || item.depth > 0) && (
              <Text style={s.detailTxt}>📐 {item.width} × {item.height} × {item.depth} cm</Text>
            )}
            {item.notes ? <Text style={[s.detailTxt, { fontStyle: 'italic', marginTop: 4 }]}>{item.notes}</Text> : null}

            {(item.width > 0 || item.depth > 0) && (
              <View style={{ marginTop: 10, backgroundColor: '#F9FAFB', borderRadius: 10, padding: 10 }}>
                <Text style={[s.label, { marginBottom: 6 }]}>Verificar Medidas</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                  <TextInput style={[s.input, { flex: 1, marginBottom: 0, fontSize: 13, padding: 8 }]} value={roomW} onChangeText={setRoomW} placeholder="Largura (cm)" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
                  <TextInput style={[s.input, { flex: 1, marginBottom: 0, fontSize: 13, padding: 8 }]} value={roomL} onChangeText={setRoomL} placeholder="Comprimento (cm)" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
                </View>
                {fits !== null && (
                  <Text style={{ fontSize: 14, fontWeight: '700', color: fits ? '#22C55E' : '#EF4444' }}>
                    {fits ? '✅ Cabe no ambiente' : '❌ Não cabe no ambiente'}
                  </Text>
                )}
              </View>
            )}

            {item.offers && item.offers.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[s.label, { marginBottom: 6 }]}>Comparativo de Preços</Text>
                {item.offers.map(offer => {
                  const total = (offer.price || 0) + (offer.shipping || 0)
                  const isCheapest = cheapest && offer.id === cheapest.id
                  return (
                    <View key={offer.id} style={[s.offerRow, isCheapest && { backgroundColor: '#D1FAE5', borderColor: '#22C55E' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.offerStore, isCheapest && { color: '#065F46' }]}>{offer.store} {isCheapest && '✓ Melhor'}</Text>
                        <Text style={s.offerDetail}>{formatCurrency(offer.price)} + frete {formatCurrency(offer.shipping)}</Text>
                      </View>
                      <Text style={[s.offerTotal, isCheapest && { color: '#065F46' }]}>{formatCurrency(total)}</Text>
                    </View>
                  )
                })}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#3B82F6' }]} onPress={() => openPriceModal(items.find(i => i.id === item.id))}>
                <Text style={s.actionBtnTxt}>Preços</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#E07A5F' }]} onPress={() => handleEdit(item)}>
                <Text style={s.actionBtnTxt}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleDelete(item)}>
                <Text style={s.actionBtnTxt}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🛋️ Móveis & Eletros</Text>
      </View>

      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 54 }} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', height: 54 }}>
          {ROOMS.map(r => (
            <TouchableOpacity key={r} style={[s.chip(roomFilter === r), { marginRight: 6 }]} onPress={() => setRoomFilter(r)}>
              <Text style={s.chipTxt(roomFilter === r)}>{r}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 54 }} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', height: 54 }}>
          {PHASES.map(p => (
            <TouchableOpacity key={p} style={[s.chip(phaseFilter === p), { marginRight: 6, backgroundColor: phaseFilter === p ? '#3D405B' : '#F3F4F6' }]} onPress={() => setPhaseFilter(p)}>
              <Text style={s.chipTxt(phaseFilter === p)}>{p}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Text style={s.statVal}>{filteredItems.length}</Text>
          <Text style={s.statLbl}>Total</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statVal}>{formatCurrency(totalPrice)}</Text>
          <Text style={s.statLbl}>Valor Total</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statVal}>{compradoCount}</Text>
          <Text style={s.statLbl}>Comprados</Text>
        </View>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="🛋️" title="Nenhum item encontrado" message="Ajuste os filtros ou adicione um novo item." />}
        ListFooterComponent={() => (
          <View style={{ marginTop: 12 }}>
            <Text style={s.sectionTitle}>Orçamento por Cômodo</Text>
            {Object.entries(roomTotals).map(([room, data]) => (
              <View key={room} style={[s.card, { flexDirection: 'row', alignItems: 'center' }]}>
                <Text style={{ flex: 1, fontWeight: '700', color: '#1F2937' }}>{room}</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginRight: 10 }}>{data.comprado}/{data.count} comprados</Text>
                <Text style={{ fontWeight: '800', color: '#E07A5F' }}>{formatCurrency(data.total)}</Text>
              </View>
            ))}
          </View>
        )}
      />

      <TouchableOpacity style={s.fab} onPress={() => { setForm(EMPTY_FORM); setEditingItem(null); setAddModal(true) }}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <BaseModal visible={addModal} onClose={() => { setAddModal(false); setForm(EMPTY_FORM) }} title="Novo Item">
        <ItemForm form={form} setForm={setForm} onSave={handleSaveItem} onPickImage={() => pickImage(uri => setForm(f => ({ ...f, photos: [...f.photos, uri] })))} />
      </BaseModal>

      <BaseModal visible={editModal} onClose={() => { setEditModal(false); setEditingItem(null) }} title="Editar Item">
        <ItemForm form={form} setForm={setForm} onSave={handleSaveItem} onPickImage={() => pickImage(uri => setForm(f => ({ ...f, photos: [...f.photos, uri] })))} />
      </BaseModal>

      <BaseModal visible={priceModal} onClose={() => { setPriceModal(false); setEditingItem(null); setSearchResults([]) }} title="Comparar Preços">
        {editingItem && (
          <View style={{ paddingBottom: 20 }}>
            <Text style={[s.sectionTitle, { marginBottom: 12 }]}>{editingItem.name}</Text>

            {/* Ofertas salvas */}
            {(editingItem.offers || []).length > 0 && (
              <>
                <Text style={s.label}>Minhas ofertas salvas</Text>
                {(editingItem.offers || []).map(offer => {
                  const total = (offer.price || 0) + (offer.shipping || 0)
                  const cheapest = getCheapestOffer(editingItem.offers)
                  const isCheapest = cheapest && offer.id === cheapest.id
                  return (
                    <View key={offer.id} style={[s.offerRow, isCheapest && { backgroundColor: '#D1FAE5', borderColor: '#22C55E' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.offerStore, isCheapest && { color: '#065F46' }]}>{offer.store}{isCheapest ? ' ✓ Melhor' : ''}</Text>
                        <Text style={s.offerDetail}>{formatCurrency(offer.price)} + frete {formatCurrency(offer.shipping)}</Text>
                      </View>
                      <Text style={[s.offerTotal, isCheapest && { color: '#065F46' }]}>{formatCurrency(total)}</Text>
                      {offer.link ? (
                        <TouchableOpacity onPress={() => Linking.openURL(offer.link)} style={{ marginLeft: 8 }}>
                          <Ionicons name="open-outline" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                      ) : null}
                      <TouchableOpacity onPress={() => handleDeleteOffer(offer.id)} style={{ marginLeft: 8 }}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )
                })}
                <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 16 }} />
              </>
            )}

            {/* Busca online */}
            <Text style={s.label}>Buscar preços online</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                style={[s.input, { flex: 1, marginBottom: 0 }]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Nome do produto..."
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={() => searchPrices(searchQuery)}
              />
              <TouchableOpacity
                style={{ backgroundColor: '#E07A5F', borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' }}
                onPress={() => searchPrices(searchQuery)}
              >
                {searching
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Ionicons name="search" size={20} color="#fff" />
                }
              </TouchableOpacity>
            </View>

            {searching && (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator color="#E07A5F" size="large" />
                <Text style={{ color: '#6B7280', marginTop: 8, fontSize: 13 }}>Buscando preços...</Text>
              </View>
            )}

            {!searching && searchResults.length === 0 && searchQuery.length > 0 && (
              <Text style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>
                Nenhum resultado encontrado.
              </Text>
            )}

            {searchResults.map(result => {
              const alreadyAdded = (editingItem.offers || []).some(o => o.link === result.permalink)
              return (
                <View key={result.id} style={s.searchResultRow}>
                  <Image source={{ uri: result.thumbnail }} style={s.searchThumb} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={2} style={s.searchTitle}>{result.title}</Text>
                    <Text style={s.searchPrice}>{formatCurrency(result.price)}</Text>
                    <Text numberOfLines={1} style={s.searchStore}>{result.seller?.nickname} · Mercado Livre</Text>
                  </View>
                  <View style={{ gap: 6 }}>
                    <TouchableOpacity
                      style={[s.searchBtn, { backgroundColor: alreadyAdded ? '#D1FAE5' : '#E07A5F' }]}
                      onPress={() => !alreadyAdded && handleAddSearchResult(result)}
                    >
                      <Ionicons name={alreadyAdded ? 'checkmark' : 'add'} size={18} color={alreadyAdded ? '#065F46' : '#fff'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.searchBtn, { backgroundColor: '#3B82F6' }]}
                      onPress={() => Linking.openURL(result.permalink)}
                    >
                      <Ionicons name="open-outline" size={18} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}

            {/* Outras lojas */}
            <View style={{ height: 1, backgroundColor: '#F3F4F6', marginTop: 8, marginBottom: 16 }} />
            <Text style={s.label}>Buscar em outras lojas</Text>
            <Text style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 12, marginTop: -4 }}>
              Toque para abrir a busca no site da loja
            </Text>
            {[
              { name: 'Casas Bahia', color: '#003DA5', url: `https://www.casasbahia.com.br/busca/${encodeURIComponent(searchQuery)}` },
              { name: 'Magazine Luiza', color: '#CC092F', url: `https://www.magazineluiza.com.br/busca/${encodeURIComponent(searchQuery)}/` },
              { name: 'MadeiraMadeira', color: '#2E7D32', url: `https://www.madeiramadeira.com.br/busca/?q=${encodeURIComponent(searchQuery)}` },
              { name: 'Tok&Stok', color: '#C8973A', url: `https://www.tokstok.com.br/busca?q=${encodeURIComponent(searchQuery)}` },
              { name: 'Leroy Merlin', color: '#78BE20', url: `https://www.leroymerlin.com.br/pesquisa/?q=${encodeURIComponent(searchQuery)}` },
              { name: 'Shopee', color: '#EE4D2D', url: `https://shopee.com.br/search?keyword=${encodeURIComponent(searchQuery)}` },
              { name: 'Google Shopping', color: '#4285F4', url: `https://www.google.com.br/search?q=${encodeURIComponent(searchQuery)}&tbm=shop` },
            ].map(store => (
              <TouchableOpacity
                key={store.name}
                style={[s.storeBtn, { borderLeftColor: store.color }]}
                onPress={() => Linking.openURL(store.url)}
              >
                <View style={[s.storeDot, { backgroundColor: store.color }]} />
                <Text style={s.storeBtnTxt}>{store.name}</Text>
                <Ionicons name="open-outline" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </BaseModal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#3D405B' },
  filterScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  chip: (active) => ({ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? '#E07A5F' : '#F3F4F6' }),
  chipTxt: (active) => ({ color: active ? '#fff' : '#6B7280', fontWeight: '700', fontSize: 13 }),
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', elevation: 1 },
  statVal: { fontSize: 14, fontWeight: '800', color: '#E07A5F' },
  statLbl: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#3D405B', marginBottom: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  itemPrice: { fontSize: 14, fontWeight: '700', color: '#E07A5F', marginTop: 2 },
  roomChip: { backgroundColor: '#EDE9FE', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  roomChipTxt: { color: '#7C3AED', fontSize: 11, fontWeight: '700' },
  detailTxt: { fontSize: 13, color: '#6B7280' },
  offerRow: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff' },
  offerStore: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  offerDetail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  offerTotal: { fontSize: 15, fontWeight: '800', color: '#E07A5F' },
  actionBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flex: 1, alignItems: 'center' },
  actionBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  label: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#1F2937', backgroundColor: '#FAFAFA', marginBottom: 12 },
  saveBtn: { backgroundColor: '#E07A5F', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  fab: { position: 'absolute', bottom: 22, right: 22, width: 58, height: 58, borderRadius: 29, backgroundColor: '#E07A5F', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  addPhotoBtn: { width: 70, height: 70, borderRadius: 8, borderWidth: 2, borderColor: '#E07A5F', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  searchResultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 10, marginBottom: 10, backgroundColor: '#fff' },
  searchThumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#F3F4F6' },
  searchTitle: { fontSize: 12, fontWeight: '600', color: '#1F2937', lineHeight: 16 },
  searchPrice: { fontSize: 14, fontWeight: '800', color: '#E07A5F', marginTop: 3 },
  searchStore: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  searchBtn: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  storeBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', borderLeftWidth: 4, padding: 14, marginBottom: 8 },
  storeDot: { width: 8, height: 8, borderRadius: 4 },
  storeBtnTxt: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1F2937' },
})
