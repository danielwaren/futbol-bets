import { Tabs } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import { useBankrollContext } from '@/context/BankrollContext'
import { useCreateBankroll } from '@futbolismo/core'
import { CreateBankrollModal } from '@/components/bankroll/CreateBankrollModal'
import { c, family, motion } from '@/theme'

/** El icono sube y crece al activarse: confirma el toque sin texto extra. */
function Icon({ label, focused }: { label: string; focused: boolean }) {
  const sv = useSharedValue(focused ? 1 : 0)
  useEffect(() => {
    sv.value = withSpring(focused ? 1 : 0, motion.spring)
  }, [focused, sv])

  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateY: -2 * sv.value },
      { scale: 1 + 0.12 * sv.value },
    ],
  }))

  return (
    <Animated.View style={anim}>
      <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.55 }}>{label}</Text>
    </Animated.View>
  )
}

export default function TabsLayout() {
  const { needsFirstBankroll } = useBankrollContext()
  const createBankroll = useCreateBankroll()

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: c.night },
          tabBarStyle: s.bar,
          tabBarActiveTintColor: c.amber,
          tabBarInactiveTintColor: c.inkFaint,
          tabBarLabelStyle: s.label,
          tabBarItemStyle: { paddingTop: 6 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Partidos',
            tabBarIcon: ({ focused }) => <Icon label="⚽" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="tabla"
          options={{
            title: 'Tabla',
            tabBarIcon: ({ focused }) => <Icon label="📊" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="historial"
          options={{
            title: 'Historial',
            tabBarIcon: ({ focused }) => <Icon label="🎫" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="estadisticas"
          options={{
            title: 'Análisis',
            tabBarIcon: ({ focused }) => <Icon label="📈" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="cuenta"
          options={{
            title: 'Cuenta',
            tabBarIcon: ({ focused }) => <Icon label="👤" focused={focused} />,
          }}
        />
      </Tabs>

      <CreateBankrollModal
        open={needsFirstBankroll}
        mandatory
        title="Bienvenido · crea tu banca"
        submitting={createBankroll.isPending}
        error={createBankroll.error}
        onSubmit={(params) => createBankroll.mutate(params)}
      />
    </>
  )
}

const s = StyleSheet.create({
  bar: {
    backgroundColor: c.board,
    borderTopColor: c.lineSoft,
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 4,
  },
  label: {
    fontFamily: family.monoMed,
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
})
