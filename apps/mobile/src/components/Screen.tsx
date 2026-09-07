import type { ReactNode } from 'react'
import { RefreshControl, StyleSheet, View } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { c, radius, shadow } from '@/theme'
import { Txt } from './ui'

/**
 * Contenedor de pantalla. El título grande se desplaza con el contenido y, al
 * pasar los 56 px de scroll, aparece una barra compacta fijada arriba: mantiene
 * el contexto sin robar altura mientras se navega una lista larga.
 */
export function Screen({
  title,
  subtitle,
  right,
  children,
  footer,
  onRefresh,
  refreshing,
  scroll = true,
}: {
  title?: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
  /** Barra flotante anclada abajo, por encima del scroll (p. ej. el cupón). */
  footer?: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
  scroll?: boolean
}) {
  const insets = useSafeAreaInsets()
  const y = useSharedValue(0)

  const onScroll = useAnimatedScrollHandler((e) => {
    y.value = e.contentOffset.y
  })

  const compact = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [56, 96], [0, 1], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(y.value, [56, 96], [-8, 0], Extrapolation.CLAMP),
      },
    ],
  }))

  const bigTitle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, 70], [1, 0], Extrapolation.CLAMP),
  }))

  const header = title ? (
    <Animated.View style={[s.head, scroll ? bigTitle : null]}>
      <View style={{ flex: 1 }}>
        <Txt variant="screen">{title}</Txt>
        {subtitle ? (
          <Txt variant="label" style={{ marginTop: 3 }}>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {right}
    </Animated.View>
  ) : null

  const pad = {
    paddingTop: insets.top + 14,
    paddingBottom: insets.bottom + 28,
    paddingHorizontal: 16,
  }

  if (!scroll) {
    return (
      <View style={[s.root, pad]}>
        {header}
        {children}
        {footer}
      </View>
    )
  }

  return (
    <View style={s.root}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={pad}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!refreshing}
              onRefresh={onRefresh}
              tintColor={c.amber}
              colors={[c.amber]}
              progressBackgroundColor={c.board}
            />
          ) : undefined
        }
      >
        {header}
        <View style={{ gap: 11 }}>{children}</View>
      </Animated.ScrollView>

      {title ? (
        <Animated.View
          pointerEvents="none"
          style={[
            s.compact,
            shadow.card,
            { paddingTop: insets.top + 8 },
            compact,
          ]}
        >
          <Txt variant="h2">{title}</Txt>
          {subtitle ? <Txt variant="label">{subtitle}</Txt> : null}
        </Animated.View>
      ) : null}

      {footer}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.night },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  compact: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,14,13,0.94)',
    borderBottomWidth: 1,
    borderBottomColor: c.lineSoft,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
})
