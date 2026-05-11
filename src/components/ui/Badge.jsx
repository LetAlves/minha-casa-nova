import React from 'react'
import { View, Text } from 'react-native'

const CONFIGS = {
  nao_iniciado: { bg: '#F3F4F6', text: '#6B7280', label: 'Não iniciado' },
  em_andamento: { bg: '#FEF3C7', text: '#D97706', label: 'Em andamento' },
  concluido: { bg: '#D1FAE5', text: '#065F46', label: 'Concluído' },
  pendente: { bg: '#F3F4F6', text: '#6B7280', label: 'Pendente' },
  pesquisando: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Pesquisando' },
  comprado: { bg: '#FEF3C7', text: '#D97706', label: 'Comprado' },
  entregue: { bg: '#D1FAE5', text: '#065F46', label: 'Entregue' },
  alta: { bg: '#FEE2E2', text: '#DC2626', label: 'Alta' },
  media: { bg: '#FEF3C7', text: '#D97706', label: 'Média' },
  baixa: { bg: '#D1FAE5', text: '#065F46', label: 'Baixa' },
  aguardando: { bg: '#F3F4F6', text: '#6B7280', label: 'Aguardando' },
  enviado: { bg: '#DBEAFE', text: '#1D4ED8', label: 'Enviado' },
  em_transito: { bg: '#FEF3C7', text: '#D97706', label: 'Em trânsito' },
}

export default function Badge({ status, style }) {
  const cfg = CONFIGS[status] || { bg: '#F3F4F6', text: '#6B7280', label: status }
  return (
    <View style={[{
      backgroundColor: cfg.bg,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
      alignSelf: 'flex-start',
    }, style]}>
      <Text style={{ color: cfg.text, fontSize: 11, fontWeight: '700' }}>{cfg.label}</Text>
    </View>
  )
}
