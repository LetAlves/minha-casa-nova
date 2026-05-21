import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProvider, useApp } from './src/context/AppContext'
import { SUPABASE_CONFIGURED } from './src/supabase/config'
import Toast from './src/components/ui/Toast'
import LoginScreen from './src/screens/LoginScreen'
import DashboardScreen from './src/screens/DashboardScreen'
import ObraScreen from './src/screens/ObraScreen'
import MoveisScreen from './src/screens/MoveisScreen'
import ChadePanelaScreen from './src/screens/ChadePanelaScreen'
import GestaoScreen from './src/screens/GestaoScreen'

const Tab = createBottomTabNavigator()

function AppTabs() {
  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#C9A84C',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#F3F4F6',
            height: 62,
            paddingBottom: 8,
          },
          tabBarIcon: ({ focused, color }) => {
            const icons = { Início: 'home', Obra: 'hammer', Móveis: 'bed', Chá: 'gift', Gestão: 'clipboard' }
            const outline = { Início: 'home-outline', Obra: 'hammer-outline', Móveis: 'bed-outline', Chá: 'gift-outline', Gestão: 'clipboard-outline' }
            return <Ionicons name={focused ? icons[route.name] : outline[route.name]} size={22} color={color} />
          },
        })}
      >
        <Tab.Screen name="Início" component={DashboardScreen} />
        <Tab.Screen name="Obra" component={ObraScreen} />
        <Tab.Screen name="Móveis" component={MoveisScreen} />
        <Tab.Screen name="Chá" component={ChadePanelaScreen} />
        <Tab.Screen name="Gestão" component={GestaoScreen} />
      </Tab.Navigator>
      <Toast />
    </>
  )
}

function AppContent() {
  const { user, authLoading } = useApp()

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#E07A5F" />
      </View>
    )
  }

  if (SUPABASE_CONFIGURED && !user) {
    return (
      <>
        <StatusBar style="dark" />
        <LoginScreen />
      </>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <AppTabs />
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  )
}
