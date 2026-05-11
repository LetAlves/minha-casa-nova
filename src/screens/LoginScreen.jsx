import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '../supabase/config'
import { useApp } from '../context/AppContext'

export default function LoginScreen() {
  const { syncAllToFirestore, showToast } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.')
      return
    }
    if (password.length < 6) {
      Alert.alert('Senha curta', 'A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        })
        if (error) throw error
        if (data.user) {
          await syncAllToFirestore(data.user.id)
          showToast('Conta criada! Dados salvos na nuvem.', 'success')
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) throw error
        showToast('Bem-vinda de volta!', 'success')
      }
    } catch (e) {
      const msg = e.message || ''
      let friendly = 'Ocorreu um erro. Tente novamente.'
      if (msg.includes('Invalid login credentials')) friendly = 'E-mail ou senha incorretos.'
      else if (msg.includes('User already registered')) friendly = 'Este e-mail já está cadastrado.'
      else if (msg.includes('Email not confirmed')) friendly = 'Confirme seu e-mail antes de entrar.'
      else if (msg.includes('Password should be')) friendly = 'A senha deve ter pelo menos 6 caracteres.'
      else if (msg.includes('Unable to validate') || msg.includes('network')) friendly = 'Sem conexão com a internet.'
      Alert.alert('Erro', friendly)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.header}>
          <View style={s.iconWrap}>
            <Ionicons name="home" size={40} color="#E07A5F" />
          </View>
          <Text style={s.title}>Minha Casa Nova</Text>
          <Text style={s.subtitle}>Organize tudo em um só lugar</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>
          <Text style={s.cardSub}>
            {isRegister
              ? 'Seus dados ficam salvos na nuvem e disponíveis em qualquer aparelho'
              : 'Entre para acessar seus dados salvos na nuvem'}
          </Text>

          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
            <TextInput
              style={s.input}
              placeholder="E-mail"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={s.inputIcon} />
            <TextInput
              style={[s.input, { flex: 1 }]}
              placeholder="Senha (mínimo 6 caracteres)"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
              <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnTxt}>{isRegister ? 'Criar conta' : 'Entrar'}</Text>
            }
          </TouchableOpacity>

          <View style={s.toggleRow}>
            <Text style={s.toggleTxt}>
              {isRegister ? 'Já tem uma conta?' : 'Não tem conta ainda?'}
            </Text>
            <TouchableOpacity onPress={() => setIsRegister(v => !v)}>
              <Text style={s.toggleLink}>{isRegister ? ' Entrar' : ' Criar conta'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.footer}>
          <Ionicons name="cloud-done-outline" size={14} color="#9CA3AF" />
          <Text style={s.footerTxt}>  Seus dados ficam sincronizados e seguros</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 36 },
  iconWrap: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#FFF5F2', alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#E07A5F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 4,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6B7280' },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 6 },
  cardSub: { fontSize: 13, color: '#6B7280', marginBottom: 24, lineHeight: 19 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 14, marginBottom: 12, height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: '#1F2937' },
  eyeBtn: { padding: 4 },
  btn: {
    backgroundColor: '#E07A5F', borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: '#E07A5F', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  toggleTxt: { fontSize: 14, color: '#6B7280' },
  toggleLink: { fontSize: 14, fontWeight: '700', color: '#E07A5F' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32 },
  footerTxt: { fontSize: 12, color: '#9CA3AF' },
})
