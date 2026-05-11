import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ⚠️  PREENCHA COM OS DADOS DO SEU PROJETO SUPABASE
// Crie o projeto em: https://supabase.com  (gratuito, sem cartão)
// Depois vá em: Settings → API → copie a URL e a anon key
const SUPABASE_URL = 'https://fjhoodfkhupvfojfljxd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqaG9vZGZraHVwdmZvamZsanhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MzAxNDksImV4cCI6MjA5NDEwNjE0OX0.W6WNmAbIOeIltOMwhIdmnX2zDg7WAMd3c92XLtgiiIQ'

export const SUPABASE_CONFIGURED = !SUPABASE_URL.startsWith('COLE')

export const supabase = SUPABASE_CONFIGURED
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null
