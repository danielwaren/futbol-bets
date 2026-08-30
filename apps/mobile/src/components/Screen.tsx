import type { ReactNode } from 'react'
import { RefreshControl, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { c } from '@/theme'
import { Txt } from './ui'

export function Screen({
  title,
  subtitle,
  right,
  children,
  onRefresh,
  refreshing,
  scroll = true,
}: {
  title?: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
  onRefresh?: () => void
  refreshing?: boolean
  scroll?: boolean
}) {
  const insets = useSafeAreaInsets()
  const header = title ? (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Txt weight="700" size={20}>
          {title}
        </Txt>
        {subtitle && (
          <Txt size={12} faint>
            {subtitle}
          </Txt>
        )}
      </View>
      {right}
    </View>
  ) : null

  const pad = {
    paddingTop: insets.top + 12,
    paddingBottom: insets.bottom + 24,
    paddingHorizontal: 16,
  }

  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: c.canvas, ...pad }}>
        {header}
        {children}
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.canvas }}
      contentContainerStyle={pad}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={c.sky}
          />
        ) : undefined
      }
    >
      {header}
      <View style={{ gap: 12 }}>{children}</View>
    </ScrollView>
  )
}
