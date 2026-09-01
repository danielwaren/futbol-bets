import { Tabs } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import { useBankrollContext } from '@/context/BankrollContext'
import { useCreateBankroll } from '@futbolismo/core'
import { CreateBankrollModal } from '@/components/bankroll/CreateBankrollModal'
import { Icon, ICON_STROKE } from '@/components/icons'
import { c, family, TAP } from '@/theme'

/** Iconos vectoriales con trazo uniforme; el activo se rellena de ámbar. */
function tabIcon(Ico: LucideIcon) {
  return function TabIcon({ color, focused }: { color: string; focused: boolean }) {
    return (
      <Ico
        size={22}
        color={color}
        strokeWidth={focused ? 2.25 : ICON_STROKE}
        fill={focused ? 'rgba(255,182,39,0.16)' : 'transparent'}
      />
    )
  }
}

const SCREENS = [
  { name: 'index', title: 'Partidos', icon: Icon.matches },
  { name: 'tabla', title: 'Tabla', icon: Icon.table },
  { name: 'historial', title: 'Historial', icon: Icon.history },
  { name: 'estadisticas', title: 'Análisis', icon: Icon.stats },
  { name: 'cuenta', title: 'Cuenta', icon: Icon.account },
] as const

export default function TabsLayout() {
  const { needsFirstBankroll } = useBankrollContext()
  const createBankroll = useCreateBankroll()

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: c.night,
            borderTopColor: c.lineSoft,
            borderTopWidth: 1,
            height: TAP + 34,
            paddingTop: 8,
            paddingBottom: 10,
          },
          tabBarItemStyle: { paddingVertical: 2 },
          tabBarActiveTintColor: c.amber,
          tabBarInactiveTintColor: c.inkFaint,
          tabBarLabelStyle: {
            fontFamily: family.monoMed,
            fontSize: 9.5,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          },
        }}
      >
        {SCREENS.map((s) => (
          <Tabs.Screen
            key={s.name}
            name={s.name}
            options={{
              title: s.title,
              tabBarIcon: tabIcon(s.icon),
              tabBarAccessibilityLabel: s.title,
            }}
          />
        ))}
      </Tabs>

      <CreateBankrollModal
        open={needsFirstBankroll}
        mandatory
        title="Crea tu banca"
        submitting={createBankroll.isPending}
        error={createBankroll.error}
        onSubmit={(params) => createBankroll.mutate(params)}
      />
    </>
  )
}
