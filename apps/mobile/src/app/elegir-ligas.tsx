import { useMemo, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  FREE_LEAGUE_SLOTS,
  LEAGUE_LIST,
  useSetFreeLeagues,
  type League,
} from '@futbolismo/core'
import { LeagueLogo } from '@/components/leagues/LeagueLogo'
import { Button, Card, ErrorText, Springy, Txt } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useEntitlements } from '@/hooks/useEntitlements'
import { usePaywall } from '@/context/PaywallContext'
import { c, motion, radius, shadow } from '@/theme'

export default function ChooseLeagues() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { userId } = useAuth()
  const { data: profile } = useProfile()
  const entitlements = useEntitlements()
  const { openPaywall } = usePaywall()
  const save = useSetFreeLeagues(userId)

  const firstTime = entitlements.needsLeagueChoice
  /** En free la elección es definitiva: cambiarla es función premium. */
  const locked = !firstTime && !entitlements.isPremium

  const [picked, setPicked] = useState<League[]>(profile?.freeLeagues ?? [])
  const ready = picked.length === FREE_LEAGUE_SLOTS

  /** Con 3 elegidas, tocar otra reemplaza la más antigua (nunca queda trabado). */
  function toggle(id: League) {
    if (locked) return
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((l) => l !== id)
      if (prev.length < FREE_LEAGUE_SLOTS) return [...prev, id]
      return [...prev.slice(1), id]
    })
  }

  const rows = useMemo(() => {
    const out: (typeof LEAGUE_LIST)[] = []
    for (let i = 0; i < LEAGUE_LIST.length; i += 2) out.push(LEAGUE_LIST.slice(i, i + 2))
    return out
  }, [])

  if (entitlements.isPremium && !firstTime) {
    return (
      <View style={[s.root, { paddingTop: insets.top + 40, padding: 24, gap: 16 }]}>
        <Txt variant="screen">Tienes las 10 ligas</Txt>
        <Txt variant="small">Con Premium juegas todas sin elegir.</Txt>
        <Button title="Volver" variant="secondary" onPress={() => router.back()} />
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeInDown.duration(motion.enter)} style={s.head}>
        <Txt variant="screen">
          {locked ? 'Tus ligas' : `Elige tus ${FREE_LEAGUE_SLOTS} ligas`}
        </Txt>
        <Txt variant="small" style={{ lineHeight: 19 }}>
          {locked
            ? 'Tu selección del plan gratis es definitiva. Con Premium juegas las 10 y las cambias cuando quieras.'
            : `Podrás apostar en estas ${FREE_LEAGUE_SLOTS}. El resto quedan en Premium. `}
          {!locked && (
            <Txt variant="small" color={c.amber}>
              Elige con calma: en el plan gratis no se pueden cambiar.
            </Txt>
          )}
        </Txt>
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {rows.map((row, ri) => (
          <Animated.View
            key={ri}
            entering={FadeInDown.delay(ri * motion.stagger).duration(motion.enter)}
            style={{ flexDirection: 'row', gap: 10 }}
          >
            {row.map((lg) => {
              const selected = picked.includes(lg.id)
              return (
                <Springy
                  key={lg.id}
                  onPress={() => toggle(lg.id)}
                  disabled={locked}
                  scaleTo={0.95}
                  style={{ flex: 1 }}
                >
                  <View
                    style={[
                      s.tile,
                      shadow.card,
                      selected && { backgroundColor: c.amberSoft },
                      locked && !selected && { opacity: 0.45 },
                    ]}
                  >
                    <LeagueLogo
                      league={lg}
                      size={50}
                      selected={selected}
                      locked={locked && !selected}
                    />
                    <Txt variant="h2" size={12.5} center numberOfLines={1}>
                      {lg.shortLabel}
                    </Txt>
                    <Txt variant="label" size={8.5} color={selected ? c.amber : c.inkFaint}>
                      {selected ? 'Gratis' : 'Premium'}
                    </Txt>
                  </View>
                </Springy>
              )
            })}
            {row.length === 1 && <View style={{ flex: 1 }} />}
          </Animated.View>
        ))}
      </ScrollView>

      <Card style={[s.foot, { marginBottom: insets.bottom + 12 }]}>
        {save.isError && <ErrorText error={save.error} />}

        {locked ? (
          <Button
            title="Cambiar ligas con Premium"
            onPress={() => openPaywall('Cambiar de ligas está incluido en Premium.')}
          />
        ) : (
          <>
            {ready && (
              <Txt variant="label" size={9}>
                Toca otra liga para cambiar tu selección
              </Txt>
            )}
            <View style={s.footRow}>
              <Txt variant="data" size={15} style={{ flex: 1 }}>
                {picked.length} / {FREE_LEAGUE_SLOTS}
              </Txt>
              {!firstTime && (
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
                      if (firstTime) router.replace('/')
                      else router.back()
                    },
                  })
                }}
              />
            </View>
          </>
        )}
      </Card>

      {locked && (
        <View style={{ position: 'absolute', top: insets.top + 8, right: 16 }}>
          <Button title="Volver" variant="ghost" size="sm" onPress={() => router.back()} />
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.night },
  head: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 14, gap: 7 },
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: 7,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: c.board,
  },
  foot: { marginHorizontal: 16, gap: 10 },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
})
