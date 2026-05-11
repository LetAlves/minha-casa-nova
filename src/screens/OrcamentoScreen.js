import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getMoveis, getOrcamento, saveOrcamento } from '../storage';

const C = { primary: '#2E7D32', light: '#E8F5E9', text: '#333', sub: '#777', danger: '#E53935', warn: '#F57F17', purple: '#5C4DB1' };

function fmt(val) {
  return val.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export default function OrcamentoScreen() {
  const [moveis, setMoveis] = useState([]);
  const [orcamento, setOrcamento] = useState({ total: 0 });
  const [modalVisible, setModalVisible] = useState(false);
  const [novoTotal, setNovoTotal] = useState('');

  useFocusEffect(useCallback(() => {
    Promise.all([getMoveis(), getOrcamento()]).then(([m, o]) => {
      setMoveis(m);
      setOrcamento(o);
    });
  }, []));

  const totalGeral = moveis.reduce((s, m) => s + m.preco, 0);
  const totalGasto = moveis.filter(m => m.comprado).reduce((s, m) => s + m.preco, 0);
  const totalPendente = moveis.filter(m => !m.comprado).reduce((s, m) => s + m.preco, 0);
  const orcamentoTotal = orcamento.total;
  const saldo = orcamentoTotal - totalGasto;
  const percentGasto = orcamentoTotal > 0 ? Math.min((totalGasto / orcamentoTotal) * 100, 100) : 0;
  const percentPendente = orcamentoTotal > 0 ? Math.min((totalGeral / orcamentoTotal) * 100, 100) : 0;

  const salvarOrcamento = async () => {
    const val = parseFloat(novoTotal.replace(',', '.').replace(/\./g, '').replace(',', '.')) || 0;
    const novo = { ...orcamento, total: val };
    await saveOrcamento(novo);
    setOrcamento(novo);
    setModalVisible(false);
  };

  const porComodo = moveis.reduce((acc, m) => {
    if (!acc[m.comodo]) acc[m.comodo] = { total: 0, gasto: 0, itens: 0, comprados: 0 };
    acc[m.comodo].total += m.preco;
    acc[m.comodo].itens += 1;
    if (m.comprado) {
      acc[m.comodo].gasto += m.preco;
      acc[m.comodo].comprados += 1;
    }
    return acc;
  }, {});

  const corSaldo = saldo < 0 ? C.danger : saldo < orcamentoTotal * 0.1 ? C.warn : C.primary;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Card de saldo */}
      <View style={s.saldoCard}>
        <Text style={s.saldoLabel}>Orçamento Total</Text>
        {orcamentoTotal > 0
          ? <Text style={s.saldoValor}>R$ {fmt(orcamentoTotal)}</Text>
          : <Text style={s.saldoNaoDefinido}>Não definido ainda</Text>
        }
        <TouchableOpacity style={s.editBtn} onPress={() => { setNovoTotal(orcamentoTotal ? fmt(orcamentoTotal) : ''); setModalVisible(true); }}>
          <Ionicons name="pencil-outline" size={15} color={C.primary} />
          <Text style={s.editBtnTxt}>{orcamentoTotal ? 'Alterar orçamento' : 'Definir orçamento'}</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de progresso */}
      {orcamentoTotal > 0 && (
        <View style={s.progressCard}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${percentGasto}%`, backgroundColor: percentGasto > 90 ? C.danger : C.primary }]} />
            {percentPendente > percentGasto && (
              <View style={[s.progressFillPendente, { width: `${percentPendente - percentGasto}%` }]} />
            )}
          </View>
          <View style={s.progressLegenda}>
            <View style={s.legendaItem}>
              <View style={[s.legendaDot, { backgroundColor: C.primary }]} />
              <Text style={s.legendaTxt}>Gasto</Text>
            </View>
            <View style={s.legendaItem}>
              <View style={[s.legendaDot, { backgroundColor: '#A5D6A7' }]} />
              <Text style={s.legendaTxt}>Pendente</Text>
            </View>
            <View style={s.legendaItem}>
              <View style={[s.legendaDot, { backgroundColor: '#e0e0e0' }]} />
              <Text style={s.legendaTxt}>Disponível</Text>
            </View>
          </View>
        </View>
      )}

      {/* Cards de resumo */}
      <View style={s.resumoGrid}>
        <View style={[s.resumoCard, { borderTopColor: C.primary }]}>
          <Ionicons name="checkmark-circle" size={24} color={C.primary} />
          <Text style={s.resumoValor}>R$ {fmt(totalGasto)}</Text>
          <Text style={s.resumoLabel}>Já comprado</Text>
        </View>
        <View style={[s.resumoCard, { borderTopColor: C.warn }]}>
          <Ionicons name="time-outline" size={24} color={C.warn} />
          <Text style={s.resumoValor}>R$ {fmt(totalPendente)}</Text>
          <Text style={s.resumoLabel}>A comprar</Text>
        </View>
        {orcamentoTotal > 0 && (
          <View style={[s.resumoCard, { borderTopColor: corSaldo }]}>
            <Ionicons name={saldo >= 0 ? 'trending-up' : 'trending-down'} size={24} color={corSaldo} />
            <Text style={[s.resumoValor, { color: corSaldo }]}>R$ {fmt(Math.abs(saldo))}</Text>
            <Text style={s.resumoLabel}>{saldo >= 0 ? 'Saldo restante' : 'Acima do orçamento'}</Text>
          </View>
        )}
      </View>

      {/* Por cômodo */}
      {Object.keys(porComodo).length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Detalhamento por Cômodo</Text>
          {Object.entries(porComodo)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([comodo, dados]) => {
              const pct = dados.itens > 0 ? (dados.comprados / dados.itens) * 100 : 0;
              return (
                <View key={comodo} style={s.comodoCard}>
                  <View style={s.comodoHeader}>
                    <Text style={s.comodoNome}>{comodo}</Text>
                    <Text style={s.comodoTotal}>R$ {fmt(dados.total)}</Text>
                  </View>
                  <View style={s.comodoBarBg}>
                    <View style={[s.comodoBarFill, { width: `${pct}%` }]} />
                  </View>
                  <View style={s.comodoFooter}>
                    <Text style={s.comodoSub}>{dados.comprados}/{dados.itens} itens comprados</Text>
                    <Text style={[s.comodoGasto, { color: dados.gasto > 0 ? C.primary : C.sub }]}>
                      {dados.gasto > 0 ? `Gasto: R$ ${fmt(dados.gasto)}` : 'Nenhum comprado'}
                    </Text>
                  </View>
                </View>
              );
            })}
        </View>
      )}

      {/* Mensagem se sem itens */}
      {moveis.length === 0 && (
        <View style={s.empty}>
          <Ionicons name="receipt-outline" size={56} color="#ddd" />
          <Text style={s.emptyTxt}>Adicione itens na aba Móveis</Text>
          <Text style={s.emptyTxt}>para ver o resumo aqui.</Text>
        </View>
      )}

      {/* Modal editar orçamento */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>💰 Definir Orçamento Total</Text>
            <Text style={s.modalDesc}>Quanto você tem disponível para gastar em móveis e decoração?</Text>
            <Text style={s.label}>Valor (R$)</Text>
            <TextInput
              style={s.input}
              value={novoTotal}
              onChangeText={setNovoTotal}
              placeholder="Ex: 10.000,00"
              keyboardType="decimal-pad"
              autoFocus
            />
            <View style={s.modalBtns}>
              <TouchableOpacity style={s.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={s.btnCancelTxt}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnSave} onPress={salvarOrcamento}>
                <Text style={s.btnSaveTxt}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F8F1' },
  saldoCard: { margin: 16, padding: 20, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  saldoLabel: { fontSize: 13, color: C.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  saldoValor: { fontSize: 34, fontWeight: '900', color: C.primary, marginVertical: 6 },
  saldoNaoDefinido: { fontSize: 18, fontWeight: '600', color: '#bbb', marginVertical: 8 },
  editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.primary, marginTop: 6 },
  editBtnTxt: { color: C.primary, fontWeight: '700', fontSize: 13, marginLeft: 6 },
  progressCard: { marginHorizontal: 16, marginBottom: 4, padding: 16, backgroundColor: '#fff', borderRadius: 14, elevation: 1 },
  progressBar: { height: 16, backgroundColor: '#e0e0e0', borderRadius: 8, flexDirection: 'row', overflow: 'hidden', marginBottom: 10 },
  progressFill: { height: '100%', backgroundColor: C.primary, borderRadius: 8 },
  progressFillPendente: { height: '100%', backgroundColor: '#A5D6A7' },
  progressLegenda: { flexDirection: 'row', gap: 14 },
  legendaItem: { flexDirection: 'row', alignItems: 'center' },
  legendaDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5 },
  legendaTxt: { fontSize: 12, color: C.sub },
  resumoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, marginTop: 12, gap: 10 },
  resumoCard: { flex: 1, minWidth: 140, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', borderTopWidth: 4, elevation: 1 },
  resumoValor: { fontSize: 18, fontWeight: '800', color: C.text, marginVertical: 4 },
  resumoLabel: { fontSize: 12, color: C.sub, fontWeight: '600', textAlign: 'center' },
  section: { margin: 16, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: C.text, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  comodoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  comodoHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  comodoNome: { fontSize: 15, fontWeight: '700', color: C.text },
  comodoTotal: { fontSize: 15, fontWeight: '800', color: C.primary },
  comodoBarBg: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 6, overflow: 'hidden' },
  comodoBarFill: { height: '100%', backgroundColor: C.primary, borderRadius: 4 },
  comodoFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  comodoSub: { fontSize: 12, color: C.sub },
  comodoGasto: { fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 50 },
  emptyTxt: { color: '#bbb', marginTop: 8, fontSize: 15, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8, textAlign: 'center' },
  modalDesc: { fontSize: 14, color: C.sub, textAlign: 'center', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 14, fontSize: 18, fontWeight: '700', backgroundColor: '#FAFAFA', color: C.text, marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  btnCancel: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center' },
  btnCancelTxt: { color: C.sub, fontWeight: '700', fontSize: 15 },
  btnSave: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
  btnSaveTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
