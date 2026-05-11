import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ⚠️  PREENCHA COM OS DADOS DO SEU PROJETO SUPABASE
// Crie o projeto em: https://supabase.com  (gratuito, sem cartão)
// Depois vá em: Settings → API → copie a URL e a anon key
const SUPABASE_URL = 'COLE_SEU_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'COLE_SUA_ANON_KEY'

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
