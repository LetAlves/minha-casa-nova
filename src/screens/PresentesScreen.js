import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, ScrollView, Image, Alert,
  KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { getPresentes, savePresentes } from '../storage';

const C = { primary: '#E91E8C', light: '#FFE4F3', text: '#333', sub: '#777', ok: '#43A047', danger: '#E53935' };

export default function PresentesScreen() {
  const [presentes, setPresentes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [filtro, setFiltro] = useState('Todos');

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [onde, setOnde] = useState('');
  const [imagem, setImagem] = useState(null);

  useFocusEffect(useCallback(() => {
    getPresentes().then(setPresentes);
  }, []));

  const abrirModal = (item = null) => {
    setEditItem(item);
    setNome(item?.nome ?? '');
    setDescricao(item?.descricao ?? '');
    setOnde(item?.onde ?? '');
    setImagem(item?.imagem ?? null);
    setModalVisible(true);
  };

  const salvar = async () => {
    if (!nome.trim()) return Alert.alert('Atenção', 'Informe o nome do presente.');
    const item = {
      id: editItem?.id ?? Date.now().toString(),
      nome: nome.trim(),
      descricao: descricao.trim(),
      onde: onde.trim(),
      imagem,
      recebido: editItem?.recebido ?? false,
    };
    const lista = editItem
      ? presentes.map(p => (p.id === editItem.id ? item : p))
      : [...presentes, item];
    await savePresentes(lista);
    setPresentes(lista);
    setModalVisible(false);
  };

  const excluir = (id) => {
    Alert.alert('Excluir presente', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          const lista = presentes.filter(p => p.id !== id);
          await savePresentes(lista);
          setPresentes(lista);
        },
      },
    ]);
  };

  const toggleRecebido = async (id) => {
    const lista = presentes.map(p => p.id === id ? { ...p, recebido: !p.recebido } : p);
    await savePresentes(lista);
    setPresentes(lista);
  };

  const escolherImagem = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permissão necessária');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setImagem(result.assets[0].uri);
  };

  const compartilharLista = async () => {
    const pendentes = presentes.filter(p => !p.recebido);
    if (pendentes.length === 0) return Alert.alert('Oba!', 'Você já recebeu todos os presentes! 🎉');
    const texto = [
      '🎁 Lista de Presentes - Chá de Panela',
      '',
      ...pendentes.map((p, i) => {
        let linha = `${i + 1}. ${p.nome}`;
        if (p.descricao) linha += `\n   ${p.descricao}`;
        if (p.onde) linha += `\n   📍 ${p.onde}`;
        return linha;
      }),
    ].join('\n');
    Share.share({ message: texto, title: 'Lista de Presentes' });
  };

  const filtros = ['Todos', 'Desejados', 'Recebidos'];
  const filtrados = filtro === 'Desejados'
    ? presentes.filter(p => !p.recebido)
    : filtro === 'Recebidos'
      ? presentes.filter(p => p.recebido)
      : presentes;

  const recebidosCount = presentes.filter(p => p.recebido).length;

  return (
    <View style={s.container}>
      <View style={s.headerInfo}>
        <View>
          <Text style={s.headerTitle}>🎀 Lista do Chá de Panela</Text>
          <Text style={s.headerSub}>{recebidosCount} de {presentes.length} presentes recebidos</Text>
        </View>
        <TouchableOpacity style={s.shareBtn} onPress={compartilharLista}>
          <Ionicons name="share-social-outline" size={18} color={C.primary} />
          <Text style={s.shareTxt}>Compartilhar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filtrosRow} contentContainerStyle={{ paddingHorizontal: 12 }}>
        {filtros.map(f => (
          <TouchableOpacity key={f} style={[s.chip, filtro === f && s.chipAtivo]} onPress={() => setFiltro(f)}>
            <Text style={[s.chipTxt, filtro === f && s.chipTxtAtivo]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtrados}
        keyExtractor={i => i.id}
        contentContainerStyle={s.lista}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="gift-outline" size={56} color="#ddd" />
            <Text style={s.emptyTxt}>Nenhum presente aqui.</Text>
            <Text style={s.emptyTxt}>Toque no + para adicionar!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[s.card, item.recebido && s.cardOk]}>
            <View style={s.cardRow}>
              {item.imagem
                ? <Image source={{ uri: item.imagem }} style={s.thumb} />
                : <View style={s.thumbPlaceholder}><Ionicons name="gift" size={28} color={C.primary} /></View>
              }
              <View style={s.cardInfo}>
                <View style={s.row}>
                  <Text style={[s.cardNome, item.recebido && s.riscado]} numberOfLines={2}>{item.nome}</Text>
                  <View style={s.row}>
                    <TouchableOpacity onPress={() => abrirModal(item)} style={s.iconBtn}>
                      <Ionicons name="pencil-outline" size={19} color="#888" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => excluir(item.id)} style={s.iconBtn}>
                      <Ionicons name="trash-outline" size={19} color={C.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
                {!!item.descricao && <Text style={s.cardDesc} numberOfLines={2}>{item.descricao}</Text>}
                {!!item.onde && <Text style={s.cardMeta}>📍 {item.onde}</Text>}
                <TouchableOpacity
                  style={[s.statusBtn, item.recebido && s.statusBtnOk]}
                  onPress={() => toggleRecebido(item.id)}
                >
                  <Ionicons name={item.recebido ? 'heart' : 'heart-outline'} size={14} color={item.recebido ? '#fff' : C.primary} />
                  <Text style={[s.statusTxt, item.recebido && s.statusTxtOk]}>
                    {item.recebido ? 'Recebido! 🎉' : 'Ainda desejado'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={s.fab} onPress={() => abrirModal()}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.overlay}>
          <View style={s.modalBox}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={s.modalTitle}>{editItem ? '✏️  Editar Presente' : '🎁  Novo Presente'}</Text>

              <Text style={s.label}>Nome do presente *</Text>
              <TextInput style={s.input} value={nome} onChangeText={setNome} placeholder="Ex: Jogo de panelas, Liquidificador..." />

              <Text style={s.label}>Descrição (opcional)</Text>
              <TextInput style={[s.input, { minHeight: 70 }]} value={descricao} onChangeText={setDescricao} placeholder="Cor, tamanho, modelo preferido..." multiline />

              <Text style={s.label}>Onde encontrar (opcional)</Text>
              <TextInput style={s.input} value={onde} onChangeText={setOnde} placeholder="Ex: Casas Bahia, Shopee, qualquer loja..." />

              <Text style={s.label}>Foto de referência</Text>
              <TouchableOpacity style={s.imgBtn} onPress={escolherImagem}>
                {imagem
                  ? <Image source={{ uri: imagem }} style={s.imgPreview} />
                  : <View style={s.imgPlaceholder}>
                      <Ionicons name="camera-outline" size={28} color={C.primary} />
                      <Text style={{ color: C.primary, marginTop: 6, fontWeight: '600' }}>Escolher foto de referência</Text>
                    </View>
                }
              </TouchableOpacity>
              {imagem && (
                <TouchableOpacity onPress={() => setImagem(null)} style={{ alignItems: 'center', marginBottom: 4 }}>
                  <Text style={{ color: C.danger, fontSize: 13 }}>Remover foto</Text>
                </TouchableOpacity>
              )}

              <View style={s.modalBtns}>
                <TouchableOpacity style={s.btnCancel} onPress={() => setModalVisible(false)}>
                  <Text style={s.btnCancelTxt}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.btnSave} onPress={salvar}>
                  <Text style={s.btnSaveTxt}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF5FB' },
  headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ffd6ee' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  headerSub: { fontSize: 13, color: C.sub, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.primary },
  shareTxt: { color: C.primary, fontWeight: '700', fontSize: 13, marginLeft: 5 },
  filtrosRow: { backgroundColor: '#fff', paddingVertical: 10, maxHeight: 58, borderBottomWidth: 1, borderBottomColor: '#ffd6ee' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FFE4F3', marginRight: 8 },
  chipAtivo: { backgroundColor: C.primary },
  chipTxt: { color: C.primary, fontSize: 13, fontWeight: '600' },
  chipTxtAtivo: { color: '#fff' },
  lista: { padding: 14, paddingBottom: 90 },
  empty: { alignItems: 'center', paddingTop: 70 },
  emptyTxt: { color: '#bbb', marginTop: 8, fontSize: 15, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardOk: { borderLeftWidth: 4, borderLeftColor: C.ok },
  cardRow: { flexDirection: 'row', padding: 12 },
  thumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#f0f0f0', marginRight: 12 },
  thumbPlaceholder: { width: 80, height: 80, borderRadius: 10, backgroundColor: '#FFE4F3', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardNome: { fontSize: 15, fontWeight: '700', color: C.text, flex: 1, marginRight: 6 },
  riscado: { textDecorationLine: 'line-through', color: '#aaa' },
  iconBtn: { padding: 4 },
  cardDesc: { color: C.sub, fontSize: 13, marginTop: 3 },
  cardMeta: { color: C.sub, fontSize: 12, marginTop: 3 },
  statusBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5, borderColor: C.primary, marginTop: 8 },
  statusBtnOk: { backgroundColor: C.ok, borderColor: C.ok },
  statusTxt: { color: C.primary, fontSize: 12, fontWeight: '700', marginLeft: 5 },
  statusTxtOk: { color: '#fff' },
  fab: { position: 'absolute', bottom: 22, right: 22, width: 58, height: 58, borderRadius: 29, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: '92%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 18, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '700', color: C.sub, marginBottom: 5, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, padding: 13, fontSize: 15, backgroundColor: '#FAFAFA', color: C.text },
  imgBtn: { borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#ddd', backgroundColor: '#FAFAFA', marginBottom: 4 },
  imgPreview: { width: '100%', height: 180 },
  imgPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 28 },
  modalBtns: { flexDirection: 'row', marginTop: 22, marginBottom: 8, gap: 10 },
  btnCancel: { flex: 1, padding: 15, borderRadius: 12, borderWidth: 1.5, borderColor: '#ddd', alignItems: 'center' },
  btnCancelTxt: { color: C.sub, fontWeight: '700', fontSize: 15 },
  btnSave: { flex: 1, padding: 15, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center' },
  btnSaveTxt: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
