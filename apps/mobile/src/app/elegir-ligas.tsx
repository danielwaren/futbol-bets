import { useMemo, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  FREE_LEAGUE_SLOTS,
  LEAGUE_LIST,
  useSetFreeLeagues,
  type League,
} from '@futbolismo/core'
import { LeagueLogo } from '@/components/leagues/LeagueLogo'
import { Button, Card, ErrorText, Txt } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useEntitlements } from '@/hooks/useEntitlements'
import { c, radius } from '@/theme'

export default function ChooseLeagues() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { userId } = useAuth()
  const { data: profile } = useProfile()
  const entitlements = useEntitlements()
  const save = useSetFreeLeagues(userId)

  const mandatory = entitlements.needsLeagueChoice
  const [picked, setPicked] = useState<League[]>(profile?.freeLeagues ?? [])
  const ready = picked.length === FREE_LEAGUE_SLOTS

  /**
   * Tocar una liga no elegida cuando ya hay 3 reemplaza a la más antigua (FIFO),
   * así nunca hay un callejón sin salida donde nada responde.
   */
  function toggle(id: League) {
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((l) => l !== id)
      if (prev.length < FREE_LEAGUE_SLOTS) return [...prev, id]
      return [...prev.slice(1), id]
    })
  }

  const rows = useMemo(() => {
    const out: (typeof LEAGUE_LIST)[] = []
    for (let i = 0; i < LEAGUE_LIST.length; i += 2) {
      out.push(LEAGUE_LIST.slice(i, i + 2))
    }
    return out
  }, [])

  if (entitlements.isPremium) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: c.canvas,
          padding: 24,
          paddingTop: insets.top + 40,
          gap: 16,
        }}
      >
        <Txt size={20} weight="700">
          Ya tienes las 10 ligas
        </Txt>
        <Txt dim>Con Premium juegas todas las ligas sin elegir.</Txt>
        <Button title="Volver" variant="secondary" onPress={() => router.back()} />
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.canvas, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 6 }}>
        <Txt size={22} weight="700">
          Elige tus {FREE_LEAGUE_SLOTS} ligas gratis
        </Txt>
        <Txt size={13} dim>
          Podrás apostar en estas {FREE_LEAGUE_SLOTS}. El resto quedan en Premium
          {mandatory ? '' : ' — puedes cambiarlas cuando quieras'}.
        </Txt>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: 'row', gap: 12 }}>
            {row.map((lg) => {
              const selected = picked.includes(lg.id)
              return (
                <Pressable
                  key={lg.id}
                  onPress={() => toggle(lg.id)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: selected ? c.sky : c.border,
                    backgroundColor: selected ? c.skyBg : c.card,
                  }}
                >
                  <LeagueLogo league={lg} size={52} selected={selected} />
                  <Txt size={12} weight="600" center>
                    {lg.shortLabel}
                  </Txt>
                  <Txt size={10} color={selected ? c.sky : c.textFaint}>
                    {selected ? 'Gratis' : 'Premium'}
                  </Txt>
                </Pressable>
              )
            })}
            {row.length === 1 && <View style={{ flex: 1 }} />}
          </View>
        ))}
      </ScrollView>

      <Card
        style={{
          margin: 16,
          marginBottom: insets.bottom + 12,
          gap: 10,
          borderColor: ready ? c.sky : c.border,
        }}
      >
        {ready && (
          <Txt size={11} faint>
            Toca otra liga para cambiar tu selección.
          </Txt>
        )}
        {save.isError && <ErrorText error={save.error} />}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Txt weight="700" size={15} style={{ flex: 1 }}>
            {picked.length} / {FREE_LEAGUE_SLOTS}
          </Txt>
          {!mandatory && (
            <Button
              title="Cancelar"
              variant="ghost"
              size="sm"
              onPress={() => router.back()}
            />
          )}
          <Button
            title="Confirmar"
            size="sm"
            disabled={!ready}
            loading={save.isPending}
            onPress={() => {
              if (!ready) return
              save.mutate(picked, {
                onSuccess: () => {
                  if (mandatory) router.replace('/')
                  else router.back()
                },
              })
            }}
          />
        </View>
      </Card>
    </View>
  )
}
