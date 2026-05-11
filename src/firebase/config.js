import { initializeApp, getApps } from 'firebase/app'
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getFirestore } from 'firebase/firestore'

// ⚠️  PREENCHA COM OS DADOS DO SEU PROJETO FIREBASE
// Crie o projeto em: https://console.firebase.google.com
const firebaseConfig = {
  apiKey: "COLE_SEU_API_KEY",
  authDomain: "COLE_SEU_AUTH_DOMAIN",
  projectId: "COLE_SEU_PROJECT_ID",
  storageBucket: "COLE_SEU_STORAGE_BUCKET",
  messagingSenderId: "COLE_SEU_MESSAGING_SENDER_ID",
  appId: "COLE_SEU_APP_ID",
}

export const FIREBASE_CONFIGURED = !firebaseConfig.apiKey.startsWith('COLE')

let _app, _auth, _db

if (FIREBASE_CONFIGURED) {
  _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  try {
    _auth = initializeAuth(_app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  } catch {
    _auth = getAuth(_app)
  }
  _db = getFirestore(_app)
}

export const auth = _auth
export const db = _db
