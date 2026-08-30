import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useBankrollContext } from '@/context/BankrollContext'
import { useCreateBankroll } from '@futbolismo/core'
import { CreateBankrollModal } from '@/components/bankroll/CreateBankrollModal'
import { c } from '@/theme'

function Icon({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 18, color }}>{label}</Text>
}

export default function TabsLayout() {
  const { needsFirstBankroll } = useBankrollContext()
  const createBankroll = useCreateBankroll()

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: c.surface,
            borderTopColor: c.border,
          },
          tabBarActiveTintColor: c.sky,
          tabBarInactiveTintColor: c.textFaint,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Partidos',
            tabBarIcon: ({ color }) => <Icon label="⚽" color={color} />,
          }}
        />
        <Tabs.Screen
          name="historial"
          options={{
            title: 'Historial',
            tabBarIcon: ({ color }) => <Icon label="📋" color={color} />,
          }}
        />
        <Tabs.Screen
          name="estadisticas"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color }) => <Icon label="📈" color={color} />,
          }}
        />
        <Tabs.Screen
          name="cuenta"
          options={{
            title: 'Cuenta',
            tabBarIcon: ({ color }) => <Icon label="👤" color={color} />,
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
