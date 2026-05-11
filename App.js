import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AppProvider } from './src/context/AppContext'
import Toast from './src/components/ui/Toast'
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
          tabBarActiveTintColor: '#E07A5F',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#F3F4F6',
            height: 62,
            paddingBottom: 8,
          },
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Início: 'home',
              Obra: 'hammer',
              Móveis: 'bed',
              Chá: 'gift',
              Gestão: 'clipboard',
            }
            const outlineIcons = {
              Início: 'home-outline',
              Obra: 'hammer-outline',
              Móveis: 'bed-outline',
              Chá: 'gift-outline',
              Gestão: 'clipboard-outline',
            }
            return (
              <Ionicons
                name={focused ? icons[route.name] : outlineIcons[route.name]}
                size={22}
                color={color}
              />
            )
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

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <AppTabs />
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  )
}
