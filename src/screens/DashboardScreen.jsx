import React, { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useApp } from '../context/AppContext'
import ProgressBar from '../components/ui/ProgressBar'
import BaseModal from '../components/modals/BaseModal'
import { calcPhaseProgress, calcOverallBudget } from '../utils/budget'
import { formatDate, formatCurrency, isOverdue, daysUntil } from '../utils/dates'

const PHASE_COLORS = ['#E07A5F', '#F2A65A', '#C77D5A', '#81B29A', '#3D405B', '#E07A5F', '#81B29A']
const PHASE_NAMES = {
  1: 'Obra Bruta', 2: 'Acabamento', 3: 'Marcenaria', 4: 'Instalações Finais',
  5: 'Móveis', 6: 'Eletrodomésticos', 7: 'Decoração',
}
const PHASE_ICONS = { 1: '🏗️', 2: '🪣', 3: '🪚', 4: '🔧', 5: '🛋️', 6: '🍳', 7: '🖼️' }

const toDisplay = (iso) => {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

const toISO = (display) => {
  const parts = display.replace(/\s/g, '').split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  if (y.length !== 4) return null
  const date = new Date(`${y}-${m}-${d}`)
  if (isNaN(date.getTime())) return null
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export default function DashboardScreen() {
  const { phases, items, budget, timeline, loaded, saveTimeline, showToast } = useApp()
  const [editModal, setEditModal] = useState(false)
  const [form, setForm] = useState({ startDate: '', targetDate: '' })

  if (!loaded) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color="#E07A5F" style={{ marginTop: 80 }} />
      </SafeAreaView>
    )
  }

  const openEdit = () => {
    setForm({
      startDate: toDisplay(timeline.startDate),
      targetDate: toDisplay(timeline.targetDate),
    })
    setEditModal(true)
  }

  const handleSave = () => {
    const startISO = toISO(form.startDate)
    const targetISO = toISO(form.targetDate)
    if (!startISO) { Alert.alert('Data inválida', 'Informe a data de início no formato DD/MM/AAAA.'); return }
    if (!targetISO) { Alert.alert('Data inválida', 'Informe a data meta no formato DD/MM/AAAA.'); return }
    if (new Date(targetISO) <= new Date(startISO)) {
      Alert.alert('Data inválida', 'A meta deve ser depois da data de início.')
      return
    }
    saveTimeline({ ...timeline, startDate: startISO, targetDate: targetISO })
    showToast('Datas atualizadas!')
    setEditModal(false)
  }

  // Build 7 phase summaries
  const phaseData = []
  phases.forEach(ph => {
    const prog = calcPhaseProgress(ph)
    phaseData.push({
      phase: ph.phase, name: ph.name, icon: ph.icon,
      color: PHASE_COLORS[ph.phase - 1],
      percent: prog.percent, done: prog.done, total: prog.total,
    })
  })
  ;[5, 6, 7].forEach(p => {
    const phItems = items.filter(i => i.phase === p)
    const total = phItems.length
    const done = phItems.filter(i => i.status === 'comprado' || i.status === 'entregue').length
    const percent = total > 0 ? Math.round((done / total) * 100) : 0
    phaseData.push({ phase: p, name: PHASE_NAMES[p], icon: PHASE_ICONS[p], color: PHASE_COLORS[p - 1], percent, done, total })
  })
  phaseData.sort((a, b) => a.phase - b.phase)

  const allItems = phases.flatMap(ph => ph.items)
  const allTotal = allItems.length + items.length
  const allDone = allItems.filter(i => i.status === 'concluido').length +
    items.filter(i => i.status === 'comprado' || i.status === 'entregue').length
  const overallPercent = allTotal > 0 ? Math.round((allDone / allTotal) * 100) : 0

  const budgetSummary = calcOverallBudget(budget)

  const overdueItems = []
  phases.forEach(ph => {
    ph.items.forEach(it => {
      if (it.status !== 'concluido' && it.endDate && isOverdue(it.endDate))
        overdueItems.push({ ...it, phaseName: ph.name })
    })
  })

  const pendingTasks = phases
    .flatMap(ph => ph.items.filter(i => i.status === 'nao_iniciado' && i.endDate).map(i => ({ ...i, phaseName: ph.name })))
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    .slice(0, 3)

  const start = new Date(timeline.startDate)
  const end = new Date(timeline.targetDate)
  const now = new Date()
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  const elapsedDays = Math.ceil((now - start) / (1000 * 60 * 60 * 24))
  const timePercent = Math.min(Math.max(Math.round((elapsedDays / totalDays) * 100), 0), 100)
  const daysLeft = daysUntil(timeline.targetDate)

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>🏠 Minha Casa Nova</Text>
          <View style={s.headerDatesRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.headerDate}>Início: {formatDate(timeline.startDate)}</Text>
              <Text style={s.headerDate}>Meta: {formatDate(timeline.targetDate)}</Text>
            </View>
            <TouchableOpacity onPress={openEdit} style={s.editDateBtn}>
              <Ionicons name="pencil" size={14} color="#E07A5F" />
              <Text style={s.editDateTxt}>Editar</Text>
            </TouchableOpacity>
          </View>
          {daysLeft !== null && (
            <View style={s.daysLeftBadge}>
              <Text style={s.daysLeftTxt}>
                {daysLeft > 0 ? `${daysLeft} dias restantes` : daysLeft === 0 ? 'Hoje é a data!' : `${Math.abs(daysLeft)} dias atrasado`}
              </Text>
            </View>
          )}
        </View>

        {/* Overall Progress */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Progresso Geral</Text>
          <ProgressBar value={overallPercent} color="#E07A5F" label={`${allDone} de ${allTotal} itens concluídos`} height={12} />
          <View style={{ marginTop: 12 }}>
            <ProgressBar value={timePercent} color="#81B29A" label="Progresso do prazo" height={8} />
          </View>
        </View>

        {/* Phase Cards */}
        <Text style={[s.sectionTitle, { marginHorizontal: 16, marginTop: 8 }]}>Fases da Obra</Text>
        {phaseData.map((ph) => (
          <View key={ph.phase} style={[s.card, { borderLeftWidth: 4, borderLeftColor: ph.color }]}>
            <View style={s.row}>
              <Text style={{ fontSize: 22, marginRight: 8 }}>{ph.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.phaseTitle}>{`Fase ${ph.phase} — ${ph.name}`}</Text>
                <Text style={s.phaseSubtitle}>{ph.done}/{ph.total} concluídos</Text>
              </View>
              <Text style={[s.phasePct, { color: ph.color }]}>{ph.percent}%</Text>
            </View>
            <View style={{ marginTop: 10 }}>
              <ProgressBar value={ph.percent} color={ph.color} showPercent={false} height={7} />
            </View>
          </View>
        ))}

        {/* Financial Summary */}
        <Text style={[s.sectionTitle, { marginHorizontal: 16, marginTop: 8 }]}>Resumo Financeiro</Text>
        <View style={s.finRow}>
          <View style={[s.finCard, { backgroundColor: '#EDE9FE' }]}>
            <Text style={s.finLabel}>Orçamento</Text>
            <Text style={[s.finValue, { color: '#7C3AED' }]}>{formatCurrency(budgetSummary.total)}</Text>
          </View>
          <View style={[s.finCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={s.finLabel}>Comprometido</Text>
            <Text style={[s.finValue, { color: '#D97706' }]}>{formatCurrency(budgetSummary.committed)}</Text>
          </View>
        </View>
        <View style={s.finRow}>
          <View style={[s.finCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={s.finLabel}>Pago</Text>
            <Text style={[s.finValue, { color: '#065F46' }]}>{formatCurrency(budgetSummary.paid)}</Text>
          </View>
          <View style={[s.finCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={s.finLabel}>Disponível</Text>
            <Text style={[s.finValue, { color: budgetSummary.remaining < 0 ? '#DC2626' : '#059669' }]}>
              {formatCurrency(budgetSummary.remaining)}
            </Text>
          </View>
        </View>

        {/* Alerts */}
        {overdueItems.length > 0 && (
          <View style={s.card}>
            <Text style={[s.sectionTitle, { color: '#DC2626' }]}>⚠️ Itens Atrasados</Text>
            {overdueItems.map(item => (
              <View key={item.id} style={s.alertItem}>
                <Text style={s.alertName}>{item.name}</Text>
                <Text style={s.alertSub}>{item.phaseName} · Previsto: {formatDate(item.endDate)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Next Tasks */}
        {pendingTasks.length > 0 && (
          <View style={s.card}>
            <Text style={s.sectionTitle}>📋 Próximas Tarefas</Text>
            {pendingTasks.map(task => {
              const d = daysUntil(task.endDate)
              return (
                <View key={task.id} style={s.taskItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.taskName}>{task.name}</Text>
                    <Text style={s.taskSub}>{task.phaseName} · Meta: {formatDate(task.endDate)}</Text>
                  </View>
                  <View style={[s.daysBadge, { backgroundColor: d && d < 14 ? '#FEE2E2' : '#F3F4F6' }]}>
                    <Text style={[s.daysBadgeTxt, { color: d && d < 14 ? '#DC2626' : '#6B7280' }]}>
                      {d !== null ? (d > 0 ? `${d}d` : 'hoje') : '—'}
                    </Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Modal editar datas */}
      <BaseModal visible={editModal} onClose={() => setEditModal(false)} title="Editar datas do projeto">
        <View style={{ paddingBottom: 16 }}>
          <Text style={s.label}>Data de início</Text>
          <TextInput
            style={s.input}
            value={form.startDate}
            onChangeText={v => setForm(f => ({ ...f, startDate: v }))}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            maxLength={10}
          />

          <Text style={s.label}>Meta de conclusão</Text>
          <TextInput
            style={s.input}
            value={form.targetDate}
            onChangeText={v => setForm(f => ({ ...f, targetDate: v }))}
            placeholder="DD/MM/AAAA"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            maxLength={10}
          />

          <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={s.saveBtnTxt}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </BaseModal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { backgroundColor: '#E07A5F', padding: 20, paddingTop: 12 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff', marginBottom: 8 },
  headerDatesRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerDate: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginBottom: 2 },
  editDateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  editDateTxt: { fontSize: 12, fontWeight: '700', color: '#E07A5F' },
  daysLeftBadge: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  daysLeftTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#3D405B', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  phaseTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  phaseSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  phasePct: { fontSize: 18, fontWeight: '900' },
  finRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 10, gap: 10 },
  finCard: { flex: 1, borderRadius: 14, padding: 14, elevation: 1 },
  finLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  finValue: { fontSize: 15, fontWeight: '800' },
  alertItem: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#FEE2E2' },
  alertName: { fontSize: 14, fontWeight: '700', color: '#DC2626' },
  alertSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  taskName: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  taskSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  daysBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  daysBadgeTxt: { fontSize: 12, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, height: 48, fontSize: 15, color: '#1F2937',
  },
  saveBtn: {
    backgroundColor: '#E07A5F', borderRadius: 12, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  saveBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
})
