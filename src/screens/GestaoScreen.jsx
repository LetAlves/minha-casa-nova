import React, { useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert,
  TextInput, ActivityIndicator, Share, Linking, ScrollView, Image, Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useApp } from '../context/AppContext'
import Badge from '../components/ui/Badge'
import BaseModal from '../components/modals/BaseModal'
import EmptyState from '../components/ui/EmptyState'
import ProgressBar from '../components/ui/ProgressBar'
import { formatDate, formatCurrency, daysUntil, addMonths } from '../utils/dates'
import { calcOverallBudget } from '../utils/budget'

const CARRIERS = ['Correios', 'Jadlog', 'Total Express', 'Outro']
const ORDER_STATUSES = ['aguardando', 'enviado', 'em_transito', 'entregue']
const ORDER_STATUS_LABELS = {
  aguardando: 'Aguardando', enviado: 'Enviado', em_transito: 'Em trânsito', entregue: 'Entregue',
}
const APPT_TYPES = ['obra', 'montagem', 'visita', 'entrega']

const PHASE_NAMES = {
  fase1: 'Obra Bruta', fase2: 'Acabamento', fase3: 'Marcenaria',
  fase4: 'Instalações Finais', fase5: 'Móveis', fase6: 'Eletrodomésticos', fase7: 'Decoração',
}
const PHASE_ICONS = {
  fase1: '🏗️', fase2: '🪣', fase3: '🪚', fase4: '🔧', fase5: '🛋️', fase6: '🍳', fase7: '🖼️',
}

function getCarrierTrackingUrl(carrier, code) {
  if (!code) return null
  if (carrier === 'Correios') return `https://rastreamento.correios.com.br/app/index.php?objeto=${code}`
  if (carrier === 'Jadlog') return `https://www.jadlog.com.br/siteInstitucional/tracking.jad?cte=${code}`
  return null
}

function advanceOrderStatus(status) {
  const idx = ORDER_STATUSES.indexOf(status)
  if (idx < ORDER_STATUSES.length - 1) return ORDER_STATUSES[idx + 1]
  return status
}

function getDaysInfo(expiryDate) {
  const d = daysUntil(expiryDate)
  if (d === null) return { color: '#22C55E', label: 'Sem data' }
  if (d > 90) return { color: '#22C55E', label: `${d} dias` }
  if (d > 30) return { color: '#F59E0B', label: `${d} dias` }
  if (d > 0) return { color: '#EF4444', label: `${d} dias` }
  return { color: '#EF4444', label: 'Expirada' }
}

// Mini calendar
function MiniCalendar({ appointments, onDayPress, selectedDay }) {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = new Date(year, month, 1).getDay()

  const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  const DAY_NAMES = ['D','S','T','Q','Q','S','S']

  const apptDays = new Set(
    appointments
      .filter(a => {
        const d = new Date(a.date)
        return d.getMonth() === month && d.getFullYear() === year
      })
      .map(a => new Date(a.date).getDate())
  )

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const today = new Date()
  const isToday = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={prevMonth} style={{ padding: 4 }}>
          <Ionicons name="chevron-back" size={20} color="#E07A5F" />
        </TouchableOpacity>
        <Text style={{ fontWeight: '800', color: '#1F2937', fontSize: 15 }}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <TouchableOpacity onPress={nextMonth} style={{ padding: 4 }}>
          <Ionicons name="chevron-forward" size={20} color="#E07A5F" />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 4 }}>
        {DAY_NAMES.map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '700', color: '#9CA3AF' }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((cell, i) => (
          <TouchableOpacity
            key={i}
            style={{ width: '14.28%', alignItems: 'center', paddingVertical: 5 }}
            onPress={() => cell && onDayPress({ day: cell, month, year })}
            disabled={!cell}
          >
            {cell ? (
              <View style={[
                { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
                isToday(cell) && { backgroundColor: '#E07A5F' },
                selectedDay?.day === cell && selectedDay?.month === month && !isToday(cell) && { backgroundColor: '#FEF3C7' },
              ]}>
                <Text style={[
                  { fontSize: 13, color: '#1F2937' },
                  isToday(cell) && { color: '#fff', fontWeight: '800' },
                ]}>
                  {cell}
                </Text>
                {apptDays.has(cell) && (
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#E07A5F', position: 'absolute', bottom: 2 }} />
                )}
              </View>
            ) : <View style={{ width: 30, height: 30 }} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

export default function GestaoScreen() {
  const {
    orders, warranties, appointments, budget,
    saveOrders, saveWarranties, saveAppointments, saveBudget,
    showToast, resetToInitial, loaded, user, logout,
  } = useApp()

  const [activeTab, setActiveTab] = useState(0)
  const [addOrderModal, setAddOrderModal] = useState(false)
  const [addWarrantyModal, setAddWarrantyModal] = useState(false)
  const [addApptModal, setAddApptModal] = useState(false)
  const [editBudgetModal, setEditBudgetModal] = useState(false)
  const [editingPhaseKey, setEditingPhaseKey] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [receiptPhoto, setReceiptPhoto] = useState('')

  const [orderForm, setOrderForm] = useState({ item: '', store: '', carrier: 'Correios', trackingCode: '', expectedDate: '' })
  const [warrantyForm, setWarrantyForm] = useState({ item: '', store: '', purchaseDate: '', warrantyMonths: '12', notes: '' })
  const [apptForm, setApptForm] = useState({ title: '', date: '', time: '', responsible: '', cost: '', type: 'obra', notes: '' })
  const [budgetPhaseForm, setBudgetPhaseForm] = useState({ planned: '', committed: '', paid: '' })

  if (!loaded) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color="#E07A5F" style={{ marginTop: 80 }} />
      </SafeAreaView>
    )
  }

  // Orders
  const handleAddOrder = () => {
    if (!orderForm.item.trim()) { Alert.alert('Atenção', 'Informe o item.'); return }
    saveOrders([...orders, { ...orderForm, id: `ord_${Date.now()}`, status: 'aguardando' }])
    showToast('Pedido adicionado!')
    setAddOrderModal(false)
    setOrderForm({ item: '', store: '', carrier: 'Correios', trackingCode: '', expectedDate: '' })
  }

  const handleAdvanceOrderStatus = (order) => {
    const next = advanceOrderStatus(order.status)
    if (next === order.status) return
    saveOrders(orders.map(o => o.id === order.id ? { ...o, status: next } : o))
    showToast(`Status: ${ORDER_STATUS_LABELS[next]}`)
  }

  const handleDeleteOrder = (order) => {
    Alert.alert('Excluir', `Excluir pedido "${order.item}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => { saveOrders(orders.filter(o => o.id !== order.id)); showToast('Pedido excluído.', 'info') } },
    ])
  }

  const handleTrackOrder = (order) => {
    const url = getCarrierTrackingUrl(order.carrier, order.trackingCode)
    if (!url) { Alert.alert('Rastreamento', 'URL de rastreamento não disponível para esta transportadora.'); return }
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o link.'))
  }

  // Warranties
  const pickReceiptImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria.'); return }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.5 })
    if (!result.canceled && result.assets?.[0]) {
      setReceiptPhoto(result.assets[0].uri)
    }
  }

  const handleAddWarranty = () => {
    if (!warrantyForm.item.trim()) { Alert.alert('Atenção', 'Informe o item.'); return }
    const months = parseInt(warrantyForm.warrantyMonths) || 12
    const expiryDate = addMonths(warrantyForm.purchaseDate, months)
    const newWarranty = { ...warrantyForm, id: `war_${Date.now()}`, warrantyMonths: months, expiryDate, receiptPhoto }
    saveWarranties([...warranties, newWarranty])
    showToast('Garantia adicionada!')
    setAddWarrantyModal(false)
    setWarrantyForm({ item: '', store: '', purchaseDate: '', warrantyMonths: '12', notes: '' })
    setReceiptPhoto('')
  }

  const handleDeleteWarranty = (w) => {
    Alert.alert('Excluir', `Excluir garantia de "${w.item}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => { saveWarranties(warranties.filter(x => x.id !== w.id)); showToast('Garantia excluída.', 'info') } },
    ])
  }

  const handleExportWarranties = async () => {
    if (warranties.length === 0) { Alert.alert('Lista vazia', 'Nenhuma garantia cadastrada.'); return }
    const text = ['📋 Lista de Garantias\n',
      ...warranties.map(w => `• ${w.item} — ${w.store}\n  Compra: ${formatDate(w.purchaseDate)} · Vence: ${formatDate(w.expiryDate)} (${w.warrantyMonths} meses)`),
    ].join('\n')
    await Share.share({ message: text })
  }

  // Appointments
  const handleAddAppt = () => {
    if (!apptForm.title.trim()) { Alert.alert('Atenção', 'Informe o título.'); return }
    saveAppointments([...appointments, { ...apptForm, id: `appt_${Date.now()}`, cost: parseFloat(apptForm.cost) || 0 }])
    showToast('Compromisso adicionado!')
    setAddApptModal(false)
    setApptForm({ title: '', date: '', time: '', responsible: '', cost: '', type: 'obra', notes: '' })
  }

  const handleDeleteAppt = (appt) => {
    Alert.alert('Excluir', `Excluir "${appt.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => { saveAppointments(appointments.filter(a => a.id !== appt.id)); showToast('Compromisso excluído.', 'info') } },
    ])
  }

  const dayAppointments = selectedDay
    ? appointments.filter(a => {
        const d = new Date(a.date)
        return d.getDate() === selectedDay.day && d.getMonth() === selectedDay.month && d.getFullYear() === selectedDay.year
      })
    : []

  const upcomingAppts = [...appointments]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .filter(a => new Date(a.date) >= new Date())
    .slice(0, 5)

  // Budget
  const budgetSummary = calcOverallBudget(budget)
  const budgetPct = budget.total > 0 ? Math.min(Math.round((budgetSummary.paid / budget.total) * 100), 100) : 0

  const handleEditBudgetPhase = (key) => {
    const phase = budget.phases[key] || { planned: 0, committed: 0, paid: 0 }
    setBudgetPhaseForm({ planned: String(phase.planned), committed: String(phase.committed), paid: String(phase.paid) })
    setEditingPhaseKey(key)
    setEditBudgetModal(true)
  }

  const handleSaveBudgetPhase = () => {
    if (!editingPhaseKey) return
    const updated = {
      ...budget,
      phases: {
        ...budget.phases,
        [editingPhaseKey]: {
          planned: parseFloat(budgetPhaseForm.planned) || 0,
          committed: parseFloat(budgetPhaseForm.committed) || 0,
          paid: parseFloat(budgetPhaseForm.paid) || 0,
        },
      },
    }
    saveBudget(updated)
    showToast('Orçamento atualizado!')
    setEditBudgetModal(false)
    setEditingPhaseKey(null)
  }

  const tabs = ['Pedidos', 'Agenda', 'Garantias', 'Orçamento']
  const tabIcons = ['cube-outline', 'calendar-outline', 'shield-checkmark-outline', 'wallet-outline']

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>📋 Gestão</Text>
      </View>
      {/* Tab bar */}
      <View style={s.tabScroll}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ height: 54 }} contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center', height: 54 }}>
          {tabs.map((tab, idx) => (
            <TouchableOpacity key={tab} style={[s.tabBtn(activeTab === idx), { marginRight: 8 }]} onPress={() => setActiveTab(idx)}>
              <Ionicons name={tabIcons[idx]} size={15} color={activeTab === idx ? '#fff' : '#6B7280'} />
              <Text style={s.tabBtnTxt(activeTab === idx)}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* PEDIDOS TAB */}
      {activeTab === 0 && (
        <>
          <FlatList
            data={orders}
            keyExtractor={item => item.id}
            renderItem={({ item: order }) => (
              <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: order.status === 'entregue' ? '#22C55E' : '#E07A5F' }]}>
                <View style={s.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{order.item}</Text>
                    <Text style={s.itemMeta}>{order.store} · {order.carrier}</Text>
                    {order.trackingCode ? <Text style={s.itemMeta}>🔍 {order.trackingCode}</Text> : null}
                    {order.expectedDate ? <Text style={s.itemMeta}>📅 Prev: {formatDate(order.expectedDate)}</Text> : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <Badge status={order.status} />
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {order.status !== 'entregue' && (
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#22C55E' }]} onPress={() => handleAdvanceOrderStatus(order)}>
                      <Text style={s.actionBtnTxt}>Avançar Status</Text>
                    </TouchableOpacity>
                  )}
                  {order.trackingCode && (
                    <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#3B82F6' }]} onPress={() => handleTrackOrder(order)}>
                      <Text style={s.actionBtnTxt}>Rastrear</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#EF4444' }]} onPress={() => handleDeleteOrder(order)}>
                    <Ionicons name="trash-outline" size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
            ListEmptyComponent={<EmptyState icon="📦" title="Nenhum pedido" message="Adicione pedidos para acompanhar as entregas." />}
          />
          <TouchableOpacity style={s.fab} onPress={() => setAddOrderModal(true)}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* AGENDA TAB */}
      {activeTab === 1 && (
        <>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}>
            <MiniCalendar
              appointments={appointments}
              selectedDay={selectedDay}
              onDayPress={setSelectedDay}
            />

            {selectedDay && (
              <View style={{ marginBottom: 16 }}>
                <Text style={s.sectionTitle}>
                  {dayAppointments.length > 0
                    ? `Compromissos em ${selectedDay.day.toString().padStart(2, '0')}/${(selectedDay.month + 1).toString().padStart(2, '0')}/${selectedDay.year}`
                    : `Sem compromissos em ${selectedDay.day.toString().padStart(2, '0')}/${(selectedDay.month + 1).toString().padStart(2, '0')}/${selectedDay.year}`}
                </Text>
                {dayAppointments.map(appt => (
                  <View key={appt.id} style={s.card}>
                    <View style={s.row}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.itemName}>{appt.title}</Text>
                        <Text style={s.itemMeta}>{appt.time} · {appt.responsible}</Text>
                        {appt.cost > 0 && <Text style={s.itemMeta}>💰 {formatCurrency(appt.cost)}</Text>}
                        {appt.notes ? <Text style={[s.itemMeta, { fontStyle: 'italic' }]}>{appt.notes}</Text> : null}
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 8 }}>
                        <View style={[s.typeBadge, { backgroundColor: appt.type === 'obra' ? '#FEF3C7' : '#DBEAFE' }]}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: appt.type === 'obra' ? '#D97706' : '#1D4ED8' }}>{appt.type}</Text>
                        </View>
                        <TouchableOpacity onPress={() => handleDeleteAppt(appt)}>
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text style={s.sectionTitle}>📅 Próximos Compromissos</Text>
            {upcomingAppts.length === 0
              ? <EmptyState icon="📅" title="Nenhum compromisso" message="Adicione compromissos à agenda." />
              : upcomingAppts.map(appt => (
                <View key={appt.id} style={s.card}>
                  <View style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{appt.title}</Text>
                      <Text style={s.itemMeta}>{formatDate(appt.date)} · {appt.time}</Text>
                      {appt.responsible ? <Text style={s.itemMeta}>👤 {appt.responsible}</Text> : null}
                      {appt.cost > 0 ? <Text style={s.itemMeta}>💰 {formatCurrency(appt.cost)}</Text> : null}
                    </View>
                    <View style={[s.typeBadge, { backgroundColor: appt.type === 'obra' ? '#FEF3C7' : '#DBEAFE' }]}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: appt.type === 'obra' ? '#D97706' : '#1D4ED8' }}>{appt.type}</Text>
                    </View>
                  </View>
                </View>
              ))
            }
          </ScrollView>
          <TouchableOpacity style={s.fab} onPress={() => setAddApptModal(true)}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* GARANTIAS TAB */}
      {activeTab === 2 && (
        <>
          <FlatList
            data={warranties}
            keyExtractor={item => item.id}
            renderItem={({ item: w }) => {
              const info = getDaysInfo(w.expiryDate)
              return (
                <View style={[s.card, { borderLeftWidth: 4, borderLeftColor: info.color }]}>
                  <View style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName}>{w.item}</Text>
                      <Text style={s.itemMeta}>{w.store}</Text>
                      <Text style={s.itemMeta}>Compra: {formatDate(w.purchaseDate)} · Vence: {formatDate(w.expiryDate)}</Text>
                      <Text style={s.itemMeta}>{w.warrantyMonths} meses de garantia</Text>
                      {w.notes ? <Text style={[s.itemMeta, { fontStyle: 'italic', marginTop: 2 }]}>{w.notes}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 6 }}>
                      <View style={[s.daysBadge, { backgroundColor: info.color + '22', borderColor: info.color, borderWidth: 1 }]}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: info.color }}>{info.label}</Text>
                      </View>
                      {w.receiptPhoto ? (
                        <Image source={{ uri: w.receiptPhoto }} style={{ width: 44, height: 44, borderRadius: 6 }} />
                      ) : null}
                      <TouchableOpacity onPress={() => handleDeleteWarranty(w)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )
            }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 }}
            ListEmptyComponent={<EmptyState icon="🛡️" title="Nenhuma garantia" message="Adicione garantias dos seus produtos." />}
          />
          <TouchableOpacity style={[s.exportBtn]} onPress={handleExportWarranties}>
            <Ionicons name="share-outline" size={16} color="#fff" />
            <Text style={s.exportBtnTxt}>Exportar Lista</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.fab} onPress={() => setAddWarrantyModal(true)}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      {/* ORÇAMENTO TAB */}
      {activeTab === 3 && (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 }}>
          {/* Summary */}
          <View style={s.card}>
            <Text style={s.sectionTitle}>Resumo Geral</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              {[
                { label: 'Total', val: budgetSummary.total, color: '#7C3AED', bg: '#EDE9FE' },
                { label: 'Comprometido', val: budgetSummary.committed, color: '#D97706', bg: '#FEF3C7' },
                { label: 'Pago', val: budgetSummary.paid, color: '#065F46', bg: '#D1FAE5' },
                { label: 'Disponível', val: budgetSummary.remaining, color: budgetSummary.remaining < 0 ? '#DC2626' : '#059669', bg: budgetSummary.remaining < 0 ? '#FEE2E2' : '#D1FAE5' },
              ].map(item => (
                <View key={item.label} style={[s.budgetCard, { backgroundColor: item.bg }]}>
                  <Text style={[s.budgetCardVal, { color: item.color }]}>{formatCurrency(item.val)}</Text>
                  <Text style={s.budgetCardLbl}>{item.label}</Text>
                </View>
              ))}
            </View>
            <ProgressBar value={budgetPct} color="#E07A5F" label={`Pago: ${budgetPct}% do total`} height={10} />
          </View>

          {/* Reset */}
          <TouchableOpacity
            style={{ borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 20 }}
            onPress={() => Alert.alert(
              'Redefinir dados',
              'Isso apaga todos os dados atuais e restaura os dados de exemplo do aplicativo. Deseja continuar?',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Redefinir', style: 'destructive', onPress: async () => { await resetToInitial(); showToast('Dados redefinidos!') } },
              ]
            )}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#9CA3AF' }}>🔄 Redefinir dados de exemplo</Text>
          </TouchableOpacity>

          {/* Conta */}
          {user && (
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="cloud-done-outline" size={16} color="#22C55E" />
                <Text style={{ marginLeft: 8, fontSize: 13, color: '#6B7280' }}>
                  Sincronizado como{' '}
                  <Text style={{ fontWeight: '700', color: '#1F2937' }}>{user.email}</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={{ borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 10, padding: 12, alignItems: 'center' }}
                onPress={() => Alert.alert(
                  'Sair da conta',
                  'Seus dados continuarão salvos na nuvem. Deseja sair?',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Sair', style: 'destructive', onPress: logout },
                  ]
                )}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>Sair da conta</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Phase breakdown */}
          <Text style={s.sectionTitle}>Por Fase</Text>
          {Object.entries(budget.phases).map(([key, ph]) => {
            const isOver = ph.committed > ph.planned
            return (
              <View key={key} style={[s.card, isOver && { borderColor: '#FCA5A5', borderWidth: 1 }]}>
                <View style={s.row}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>{PHASE_ICONS[key]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{PHASE_NAMES[key]}</Text>
                    {isOver && <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '700' }}>⚠️ Acima do planejado</Text>}
                  </View>
                  <TouchableOpacity onPress={() => handleEditBudgetPhase(key)} style={{ padding: 4 }}>
                    <Ionicons name="pencil" size={16} color="#E07A5F" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  {[
                    { label: 'Planejado', val: ph.planned, color: '#6B7280' },
                    { label: 'Compromet.', val: ph.committed, color: isOver ? '#DC2626' : '#D97706' },
                    { label: 'Pago', val: ph.paid, color: '#22C55E' },
                  ].map(item => (
                    <View key={item.label} style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: 10, color: '#9CA3AF', fontWeight: '700' }}>{item.label}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: item.color }}>{formatCurrency(item.val)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* ADD ORDER MODAL */}
      <BaseModal visible={addOrderModal} onClose={() => setAddOrderModal(false)} title="Novo Pedido">
        <View style={{ paddingBottom: 20 }}>
          <Text style={s.label}>Item *</Text>
          <TextInput style={s.input} value={orderForm.item} onChangeText={v => setOrderForm(f => ({ ...f, item: v }))} placeholder="Ex: Sofá 3 lugares" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Loja</Text>
          <TextInput style={s.input} value={orderForm.store} onChangeText={v => setOrderForm(f => ({ ...f, store: v }))} placeholder="Ex: MadeiraMadeira" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Transportadora</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CARRIERS.map(c => (
              <TouchableOpacity key={c} style={[s.chip(orderForm.carrier === c), { marginRight: 6 }]} onPress={() => setOrderForm(f => ({ ...f, carrier: c }))}>
                <Text style={s.chipTxt(orderForm.carrier === c)}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={s.label}>Código de Rastreio</Text>
          <TextInput style={s.input} value={orderForm.trackingCode} onChangeText={v => setOrderForm(f => ({ ...f, trackingCode: v }))} placeholder="Ex: AA123456789BR" placeholderTextColor="#9CA3AF" autoCapitalize="characters" />
          <Text style={s.label}>Data Prevista (AAAA-MM-DD)</Text>
          <TextInput style={s.input} value={orderForm.expectedDate} onChangeText={v => setOrderForm(f => ({ ...f, expectedDate: v }))} placeholder="2025-12-01" placeholderTextColor="#9CA3AF" />
          <TouchableOpacity style={s.saveBtn} onPress={handleAddOrder}>
            <Text style={s.saveBtnTxt}>Adicionar Pedido</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>

      {/* ADD WARRANTY MODAL */}
      <BaseModal visible={addWarrantyModal} onClose={() => setAddWarrantyModal(false)} title="Nova Garantia">
        <View style={{ paddingBottom: 20 }}>
          <Text style={s.label}>Item *</Text>
          <TextInput style={s.input} value={warrantyForm.item} onChangeText={v => setWarrantyForm(f => ({ ...f, item: v }))} placeholder="Ex: Geladeira" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Loja</Text>
          <TextInput style={s.input} value={warrantyForm.store} onChangeText={v => setWarrantyForm(f => ({ ...f, store: v }))} placeholder="Ex: Magazine Luiza" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Data de Compra (AAAA-MM-DD)</Text>
          <TextInput style={s.input} value={warrantyForm.purchaseDate} onChangeText={v => setWarrantyForm(f => ({ ...f, purchaseDate: v }))} placeholder="2025-01-01" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Meses de Garantia</Text>
          <TextInput style={s.input} value={warrantyForm.warrantyMonths} onChangeText={v => setWarrantyForm(f => ({ ...f, warrantyMonths: v }))} placeholder="12" placeholderTextColor="#9CA3AF" keyboardType="number-pad" />
          {warrantyForm.purchaseDate && warrantyForm.warrantyMonths ? (
            <Text style={{ color: '#22C55E', fontSize: 13, fontWeight: '700', marginBottom: 12 }}>
              Vence em: {formatDate(addMonths(warrantyForm.purchaseDate, parseInt(warrantyForm.warrantyMonths) || 12))}
            </Text>
          ) : null}
          <Text style={s.label}>Observações</Text>
          <TextInput style={[s.input, { height: 70 }]} value={warrantyForm.notes} onChangeText={v => setWarrantyForm(f => ({ ...f, notes: v }))} placeholder="Notas..." placeholderTextColor="#9CA3AF" multiline />
          <Text style={s.label}>Foto do Recibo</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {receiptPhoto ? <Image source={{ uri: receiptPhoto }} style={{ width: 60, height: 60, borderRadius: 8 }} /> : null}
            <TouchableOpacity onPress={pickReceiptImage} style={s.addPhotoBtn}>
              <Ionicons name="camera" size={22} color="#E07A5F" />
              <Text style={{ fontSize: 11, color: '#E07A5F', marginTop: 2 }}>Foto</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={s.saveBtn} onPress={handleAddWarranty}>
            <Text style={s.saveBtnTxt}>Adicionar Garantia</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>

      {/* ADD APPOINTMENT MODAL */}
      <BaseModal visible={addApptModal} onClose={() => setAddApptModal(false)} title="Novo Compromisso">
        <View style={{ paddingBottom: 20 }}>
          <Text style={s.label}>Título *</Text>
          <TextInput style={s.input} value={apptForm.title} onChangeText={v => setApptForm(f => ({ ...f, title: v }))} placeholder="Ex: Visita do encanador" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Data (AAAA-MM-DD)</Text>
          <TextInput style={s.input} value={apptForm.date} onChangeText={v => setApptForm(f => ({ ...f, date: v }))} placeholder="2025-06-01" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Horário</Text>
          <TextInput style={s.input} value={apptForm.time} onChangeText={v => setApptForm(f => ({ ...f, time: v }))} placeholder="09:00" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Responsável</Text>
          <TextInput style={s.input} value={apptForm.responsible} onChangeText={v => setApptForm(f => ({ ...f, responsible: v }))} placeholder="Nome do profissional" placeholderTextColor="#9CA3AF" />
          <Text style={s.label}>Custo (R$)</Text>
          <TextInput style={s.input} value={apptForm.cost} onChangeText={v => setApptForm(f => ({ ...f, cost: v }))} placeholder="0,00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
          <Text style={s.label}>Tipo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {APPT_TYPES.map(t => (
              <TouchableOpacity key={t} style={s.chip(apptForm.type === t)} onPress={() => setApptForm(f => ({ ...f, type: t }))}>
                <Text style={s.chipTxt(apptForm.type === t)}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.label}>Observações</Text>
          <TextInput style={[s.input, { height: 70 }]} value={apptForm.notes} onChangeText={v => setApptForm(f => ({ ...f, notes: v }))} placeholder="Notas..." placeholderTextColor="#9CA3AF" multiline />
          <TouchableOpacity style={s.saveBtn} onPress={handleAddAppt}>
            <Text style={s.saveBtnTxt}>Adicionar Compromisso</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>

      {/* EDIT BUDGET PHASE MODAL */}
      <BaseModal visible={editBudgetModal} onClose={() => { setEditBudgetModal(false); setEditingPhaseKey(null) }} title={`Editar ${editingPhaseKey ? PHASE_NAMES[editingPhaseKey] : ''}`}>
        <View style={{ paddingBottom: 20 }}>
          <Text style={s.label}>Valor Planejado (R$)</Text>
          <TextInput style={s.input} value={budgetPhaseForm.planned} onChangeText={v => setBudgetPhaseForm(f => ({ ...f, planned: v }))} placeholder="0,00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
          <Text style={s.label}>Comprometido (R$)</Text>
          <TextInput style={s.input} value={budgetPhaseForm.committed} onChangeText={v => setBudgetPhaseForm(f => ({ ...f, committed: v }))} placeholder="0,00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
          <Text style={s.label}>Pago (R$)</Text>
          <TextInput style={s.input} value={budgetPhaseForm.paid} onChangeText={v => setBudgetPhaseForm(f => ({ ...f, paid: v }))} placeholder="0,00" placeholderTextColor="#9CA3AF" keyboardType="decimal-pad" />
          <TouchableOpacity style={s.saveBtn} onPress={handleSaveBudgetPhase}>
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
  tabBtn: (active) => ({ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: active ? '#E07A5F' : '#F3F4F6' }),
  tabBtnTxt: (active) => ({ color: active ? '#fff' : '#6B7280', fontWeight: '700', fontSize: 13 }),
  row: { flexDirection: 'row', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#3D405B', marginBottom: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  itemMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  typeBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  daysBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  actionBtn: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flex: 1, alignItems: 'center', justifyContent: 'center' },
  actionBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 12 },
  budgetCard: { borderRadius: 12, padding: 12, width: '47%' },
  budgetCardVal: { fontSize: 14, fontWeight: '800' },
  budgetCardLbl: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  label: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, fontSize: 15, color: '#1F2937', backgroundColor: '#FAFAFA', marginBottom: 12 },
  saveBtn: { backgroundColor: '#E07A5F', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  fab: { position: 'absolute', bottom: 22, right: 22, width: 58, height: 58, borderRadius: 29, backgroundColor: '#E07A5F', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  exportBtn: { position: 'absolute', bottom: 90, right: 22, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#3D405B', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, elevation: 5 },
  exportBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  chip: (active) => ({ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: active ? '#E07A5F' : '#F3F4F6' }),
  chipTxt: (active) => ({ color: active ? '#fff' : '#6B7280', fontWeight: '700', fontSize: 13 }),
  addPhotoBtn: { width: 70, height: 70, borderRadius: 8, borderWidth: 2, borderColor: '#E07A5F', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
})
