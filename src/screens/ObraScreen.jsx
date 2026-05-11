import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  TextInput, FlatList, Image, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useApp } from '../context/AppContext'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import StarRating from '../components/ui/StarRating'
import BaseModal from '../components/modals/BaseModal'
import EmptyState from '../components/ui/EmptyState'
import { calcPhaseProgress } from '../utils/budget'
import { formatDate, formatCurrency } from '../utils/dates'

const STATUS_OPTIONS = [
  { value: 'nao_iniciado', label: 'Não iniciado' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
]

const EMPTY_ITEM = {
  name: '', status: 'nao_iniciado', responsible: '', contact: '',
  contractValue: '', paidValue: '', startDate: '', endDate: '', notes: '', photos: [],
}

const EMPTY_PROF = { name: '', specialty: '', phone: '', rating: 5, notes: '' }

function ObraItemForm({ form, setForm, onSave, onAddPhoto }) {
  return (
    <View style={{ paddingBottom: 20 }}>
      <Text style={s.label}>Nome *</Text>
      <TextInput style={s.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="Ex: Fundação" placeholderTextColor="#9CA3AF" autoCorrect={false} />

      <Text style={s.label}>Status</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {STATUS_OPTIONS.map(opt => (
          <TouchableOpacity key={opt.value} style={[s.tabBtn(form.status === opt.value, '#E07A5F')]} onPress={() => setForm(f => ({ ...f, status: opt.value }))}>
            <Text style={s.tabBtnTxt(form.status === opt.value)}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Responsável</Text>
      <TextInput style={s.input} value={form.responsible} onChangeText={v => setForm(f => ({ ...f, responsible: v }))} placeholder="Nome do responsável" placeholderTextColor="#9CA3AF" autoCorrect={false} />

      <Text style={s.label}>Contato</Text>
      <TextInput style={s.input} value={form.contact} onChangeText={v => setForm(f => ({ ...f, contact: v }))} placeholder="(11) 99999-0000" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />

      <Text style={s.label}>Valor do Contrato (R$)</Text>
      <TextInput style={s.input} value={String(form.contractValue)} onChangeText={v => setForm(f => ({ ...f, contractValue: v }))} placeholder="0,00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />

      <Text style={s.label}>Valor Pago (R$)</Text>
      <TextInput style={s.input} value={String(form.paidValue)} onChangeText={v => setForm(f => ({ ...f, paidValue: v }))} placeholder="0,00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />

      <Text style={s.label}>Data de Início (AAAA-MM-DD)</Text>
      <TextInput style={s.input} value={form.startDate} onChangeText={v => setForm(f => ({ ...f, startDate: v }))} placeholder="2025-01-01" placeholderTextColor="#9CA3AF" />

      <Text style={s.label}>Data Prevista de Conclusão (AAAA-MM-DD)</Text>
      <TextInput style={s.input} value={form.endDate} onChangeText={v => setForm(f => ({ ...f, endDate: v }))} placeholder="2025-12-01" placeholderTextColor="#9CA3AF" />

      <Text style={s.label}>Observações</Text>
      <TextInput style={[s.input, { height: 80 }]} value={form.notes} onChangeText={v => setForm(f => ({ ...f, notes: v }))} placeholder="Notas adicionais..." placeholderTextColor="#9CA3AF" multiline autoCorrect={false} />

      <Text style={s.label}>Fotos</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {form.photos.map((uri, idx) => (
          <TouchableOpacity key={idx} onLongPress={() => setForm(f => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }))}>
            <Image source={{ uri }} style={{ width: 70, height: 70, borderRadius: 8 }} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={onAddPhoto} style={s.addPhotoBtn}>
          <Ionicons name="camera" size={24} color="#E07A5F" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.saveBtn} onPress={onSave}>
        <Text style={s.saveBtnTxt}>Salvar</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function ObraScreen() {
  const {
    phases, professionals, loaded,
    updatePhaseItem, addPhaseItem, deletePhaseItem,
    saveProfessionals, showToast,
  } = useApp()

  const [activeTab, setActiveTab] = useState(0)
  const [expandedItem, setExpandedItem] = useState(null)
  const [editModal, setEditModal] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [profModal, setProfModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(EMPTY_ITEM)
  const [profForm, setProfForm] = useState(EMPTY_PROF)

  if (!loaded) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color="#E07A5F" style={{ marginTop: 80 }} />
      </SafeAreaView>
    )
  }

  const currentPhase = phases[activeTab]
  const prog = calcPhaseProgress(currentPhase)

  const pickImage = async (onPicked) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria de fotos.')
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

  const handleAddPhoto = () => {
    pickImage(uri => setForm(f => ({ ...f, photos: [...f.photos, uri] })))
  }

  const handleSaveItem = () => {
    if (!form.name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do item.')
      return
    }
    const data = {
      ...form,
      contractValue: parseFloat(form.contractValue) || 0,
      paidValue: parseFloat(form.paidValue) || 0,
    }
    if (editingItem) {
      updatePhaseItem(currentPhase.id, editingItem.id, data)
      showToast('Item atualizado com sucesso!')
      setEditModal(false)
    } else {
      const newItem = { ...data, id: `${currentPhase.id}_${Date.now()}` }
      addPhaseItem(currentPhase.id, newItem)
      showToast('Item adicionado!')
      setAddModal(false)
    }
    setForm(EMPTY_ITEM)
    setEditingItem(null)
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setForm({
      ...item,
      contractValue: String(item.contractValue || ''),
      paidValue: String(item.paidValue || ''),
    })
    setEditModal(true)
  }

  const handleDelete = (item) => {
    Alert.alert(
      'Excluir item',
      `Deseja excluir "${item.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive', onPress: () => {
            deletePhaseItem(currentPhase.id, item.id)
            showToast('Item excluído.', 'info')
            setExpandedItem(null)
          }
        },
      ]
    )
  }

  const handleSaveProf = () => {
    if (!profForm.name.trim()) {
      Alert.alert('Atenção', 'Informe o nome do profissional.')
      return
    }
    const updated = [...professionals, { ...profForm, id: `p_${Date.now()}` }]
    saveProfessionals(updated)
    showToast('Profissional adicionado!')
    setProfModal(false)
    setProfForm(EMPTY_PROF)
  }

  const handleDeleteProf = (id) => {
    Alert.alert('Excluir profissional', 'Deseja excluir este profissional?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: () => {
          saveProfessionals(professionals.filter(p => p.id !== id))
          showToast('Profissional excluído.', 'info')
        }
      },
    ])
  }

  const renderItem = ({ item }) => {
    const isExpanded = expandedItem === item.id
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => setExpandedItem(isExpanded ? null : item.id)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.8}
      >
        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.itemName}>{item.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Badge status={item.status} />
              {item.responsible ? <Text style={s.itemMeta}>{item.responsible}</Text> : null}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.itemValue}>{formatCurrency(item.contractValue)}</Text>
            <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#6B7280" style={{ marginTop: 4 }} />
          </View>
        </View>

        {isExpanded && (
          <View style={{ marginTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
              {item.contact ? <Text style={s.detailTxt}>📞 {item.contact}</Text> : null}
              {item.startDate ? <Text style={s.detailTxt}>🗓️ Início: {formatDate(item.startDate)}</Text> : null}
              {item.endDate ? <Text style={s.detailTxt}>🎯 Prev: {formatDate(item.endDate)}</Text> : null}
            </View>
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
              <Text style={s.detailTxt}>Contrato: <Text style={{ fontWeight: '700' }}>{formatCurrency(item.contractValue)}</Text></Text>
              <Text style={s.detailTxt}>Pago: <Text style={{ fontWeight: '700', color: '#22C55E' }}>{formatCurrency(item.paidValue)}</Text></Text>
            </View>
            {item.notes ? <Text style={[s.detailTxt, { marginBottom: 8, fontStyle: 'italic' }]}>{item.notes}</Text> : null}
            {item.photos && item.photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {item.photos.map((uri, idx) => (
                  <Image key={idx} source={{ uri }} style={{ width: 80, height: 80, borderRadius: 8, marginRight: 8 }} />
                ))}
              </ScrollView>
            )}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={s.editBtn} onPress={() => handleEdit(item)}>
                <Ionicons name="pencil" size={14} color="#fff" />
                <Text style={s.editBtnTxt}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.editBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleDelete(item)}>
                <Ionicons name="trash-outline" size={14} color="#fff" />
                <Text style={s.editBtnTxt}>Excluir</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  // Simple Gantt view
  const minDate = new Date('2025-01-15')
  const maxDate = new Date('2025-12-01')
  const totalMs = maxDate - minDate

  const getBarStyle = (ph) => {
    if (!ph.items.length) return { left: '0%', width: '0%' }
    const dates = ph.items.filter(i => i.startDate && i.endDate)
    if (!dates.length) return { left: '0%', width: '5%' }
    const starts = dates.map(i => new Date(i.startDate))
    const ends = dates.map(i => new Date(i.endDate))
    const phStart = new Date(Math.min(...starts))
    const phEnd = new Date(Math.max(...ends))
    const left = Math.max(0, ((phStart - minDate) / totalMs) * 100)
    const width = Math.min(100 - left, ((phEnd - phStart) / totalMs) * 100)
    return { left: `${left.toFixed(1)}%`, width: `${Math.max(width, 2).toFixed(1)}%` }
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>🔨 Obra & Construção</Text>
      </View>
      {/* Tab selector */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 54 }} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', height: 54 }}>
          {phases.map((ph, idx) => (
            <TouchableOpacity
              key={ph.id}
              style={[s.tabBtn(activeTab === idx, ph.color), { marginRight: 8 }]}
              onPress={() => { setActiveTab(idx); setExpandedItem(null) }}
            >
              <Text style={s.tabBtnTxt(activeTab === idx)}>{ph.icon} Fase {ph.phase}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Phase header */}
        <View style={[s.phaseHeader, { backgroundColor: currentPhase.color }]}>
          <View style={s.row}>
            <Text style={{ fontSize: 30, marginRight: 10 }}>{currentPhase.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.phaseHeaderTitle}>{currentPhase.name}</Text>
              <Text style={s.phaseHeaderSub}>{prog.done}/{prog.total} concluídos · {prog.inProgress} em andamento</Text>
            </View>
            <View style={s.circleProgress}>
              <Text style={s.circleProgressTxt}>{prog.percent}%</Text>
            </View>
          </View>
          <View style={{ marginTop: 10 }}>
            <ProgressBar value={prog.percent} color="rgba(255,255,255,0.9)" showPercent={false} height={10} />
          </View>
        </View>

        {/* Items list */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          {currentPhase.items.length === 0 ? (
            <EmptyState icon="🔨" title="Nenhum item nesta fase" message="Toque no + para adicionar um item." />
          ) : (
            currentPhase.items.map(item => (
              <View key={item.id}>
                {renderItem({ item })}
              </View>
            ))
          )}
        </View>

        {/* Profissionais */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <View style={[s.row, { justifyContent: 'space-between', marginBottom: 12 }]}>
            <Text style={s.sectionTitle}>👷 Profissionais</Text>
            <TouchableOpacity onPress={() => setProfModal(true)} style={s.addSmallBtn}>
              <Ionicons name="add" size={18} color="#E07A5F" />
              <Text style={{ color: '#E07A5F', fontWeight: '700', fontSize: 13 }}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          {professionals.length === 0 ? (
            <EmptyState icon="👷" title="Nenhum profissional" message="Adicione os profissionais contratados." />
          ) : (
            professionals.map(prof => (
              <View key={prof.id} style={s.card}>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{prof.name}</Text>
                    <Text style={s.itemMeta}>{prof.specialty}</Text>
                    <Text style={s.itemMeta}>📞 {prof.phone}</Text>
                    {prof.notes ? <Text style={[s.itemMeta, { fontStyle: 'italic' }]}>{prof.notes}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <StarRating value={prof.rating} size={16} />
                    <TouchableOpacity onPress={() => handleDeleteProf(prof.id)}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Gantt */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <Text style={s.sectionTitle}>📅 Cronograma</Text>
          <View style={[s.card, { padding: 10 }]}>
            <View style={s.row}>
              <Text style={{ fontSize: 10, color: '#6B7280', flex: 1 }}>Jan/25</Text>
              <Text style={{ fontSize: 10, color: '#6B7280' }}>Dez/25</Text>
            </View>
            {phases.map(ph => {
              const bar = getBarStyle(ph)
              return (
                <View key={ph.id} style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginBottom: 3 }}>{ph.icon} {ph.name}</Text>
                  <View style={{ height: 16, backgroundColor: '#F3F4F6', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                    <View style={{ position: 'absolute', left: bar.left, width: bar.width, height: 16, backgroundColor: ph.color, borderRadius: 8, opacity: 0.8 }} />
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => { setForm(EMPTY_ITEM); setEditingItem(null); setAddModal(true) }}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add item modal */}
      <BaseModal visible={addModal} onClose={() => setAddModal(false)} title="Novo Item">
        <ObraItemForm form={form} setForm={setForm} onSave={handleSaveItem} onAddPhoto={handleAddPhoto} />
      </BaseModal>

      {/* Edit item modal */}
      <BaseModal visible={editModal} onClose={() => { setEditModal(false); setEditingItem(null) }} title="Editar Item">
        <ObraItemForm form={form} setForm={setForm} onSave={handleSaveItem} onAddPhoto={handleAddPhoto} />
      </BaseModal>

      {/* Add professional modal */}
      <BaseModal visible={profModal} onClose={() => setProfModal(false)} title="Novo Profissional">
        <View style={{ paddingBottom: 20 }}>
          <Text style={s.label}>Nome *</Text>
          <TextInput style={s.input} value={profForm.name} onChangeText={v => setProfForm(f => ({ ...f, name: v }))} placeholder="Nome do profissional" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Especialidade</Text>
          <TextInput style={s.input} value={profForm.specialty} onChangeText={v => setProfForm(f => ({ ...f, specialty: v }))} placeholder="Ex: Pedreiro, Eletricista..." placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Telefone</Text>
          <TextInput style={s.input} value={profForm.phone} onChangeText={v => setProfForm(f => ({ ...f, phone: v }))} placeholder="(11) 99999-0000" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
          <Text style={s.label}>Avaliação</Text>
          <StarRating value={profForm.rating} onChange={v => setProfForm(f => ({ ...f, rating: v }))} size={28} />
          <View style={{ marginBottom: 12 }} />
          <Text style={s.label}>Observações</Text>
          <TextInput style={[s.input, { height: 70 }]} value={profForm.notes} onChangeText={v => setProfForm(f => ({ ...f, notes: v }))} placeholder="Notas..." placeholderTextColor="#9CA3AF" multiline />
          <TouchableOpacity style={s.saveBtn} onPress={handleSaveProf}>
            <Text style={s.saveBtnTxt}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#3D405B' },
  tabScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  tabBtn: (active, color) => ({ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? color : '#F3F4F6' }),
  tabBtnTxt: (active) => ({ color: active ? '#fff' : '#6B7280', fontWeight: '700', fontSize: 13 }),
  phaseHeader: { padding: 16, marginHorizontal: 16, marginTop: 12, borderRadius: 16 },
  phaseHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  phaseHeaderSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  circleProgress: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  circleProgressTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#3D405B', marginBottom: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  itemMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  itemValue: { fontSize: 14, fontWeight: '700', color: '#E07A5F' },
  detailTxt: { fontSize: 13, color: '#6B7280' },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E07A5F', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', gap: 6 },
  editBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addSmallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  fab: { position: 'absolute', bottom: 22, right: 22, width: 58, height: 58, borderRadius: 29, backgroundColor: '#E07A5F', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  label: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#1F2937', backgroundColor: '#FAFAFA', marginBottom: 12 },
  saveBtn: { backgroundColor: '#E07A5F', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  addPhotoBtn: { width: 70, height: 70, borderRadius: 8, borderWidth: 2, borderColor: '#E07A5F', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
})
