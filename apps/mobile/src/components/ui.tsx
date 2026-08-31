import type { ReactNode } from 'react'
import {
  ActivityIndicator,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native'
import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { c, family, motion, radius, shadow, space, type } from '@/theme'

/* ------------------------------------------------------------------ texto */

type TxtVariant = keyof typeof type

export function Txt({
  children,
  variant = 'body',
  color,
  size,
  center,
  style,
  numberOfLines,
}: {
  children: ReactNode
  variant?: TxtVariant
  color?: string
  size?: number
  center?: boolean
  style?: StyleProp<TextStyle>
  numberOfLines?: number
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        type[variant],
        color ? { color } : null,
        size ? { fontSize: size } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
    >
      {children}
    </Text>
  )
}

/* ------------------------------------------------------------------ card */

export function Card({
  children,
  style,
  flat = false,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  flat?: boolean
}) {
  return (
    <View style={[s.card, !flat && shadow.card, style]}>{children}</View>
  )
}

/* ---------------------------------------------------------------- pressable */

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/** Pressable con resorte: el gesto más repetido de la app debe sentirse rico. */
export function Springy({
  children,
  onPress,
  disabled,
  scaleTo = 0.94,
  style,
}: {
  children: ReactNode
  onPress?: () => void
  disabled?: boolean
  scaleTo?: number
  style?: StyleProp<ViewStyle>
}) {
  const sv = useSharedValue(1)
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sv.value }] }))
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        sv.value = withSpring(scaleTo, motion.spring)
      }}
      onPressOut={() => {
        sv.value = withSpring(1, motion.spring)
      }}
      style={[style, anim]}
    >
      {children}
    </AnimatedPressable>
  )
}

/* ---------------------------------------------------------------- botones */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'

const BTN: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: c.amber, fg: c.amberInk },
  secondary: { bg: c.board3, fg: c.ink },
  ghost: { bg: 'transparent', fg: c.inkDim, border: c.line },
  danger: { bg: c.flag, fg: '#2B0A0A' },
  success: { bg: c.pitch, fg: '#04231A' },
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  style,
  left,
}: {
  title: string
  onPress?: () => void
  variant?: Variant
  size?: 'sm' | 'md'
  loading?: boolean
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  left?: ReactNode
}) {
  const v = BTN[variant]
  const off = disabled || loading
  return (
    <Springy onPress={onPress} disabled={off} scaleTo={0.96} style={style}>
      <View
        style={[
          s.btn,
          size === 'sm' && s.btnSm,
          {
            backgroundColor: v.bg,
            borderColor: v.border ?? 'transparent',
            borderWidth: v.border ? 1 : 0,
            opacity: off ? 0.45 : 1,
          },
          variant === 'primary' && !off ? shadow.card : null,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={v.fg} size="small" />
        ) : (
          <>
            {left}
            <Text
              style={{
                fontFamily: family.bold,
                color: v.fg,
                fontSize: size === 'sm' ? 12.5 : 14.5,
                letterSpacing: 0.2,
              }}
            >
              {title}
            </Text>
          </>
        )}
      </View>
    </Springy>
  )
}

/* ------------------------------------------------------------------ campos */

export function Field({
  label,
  hint,
  children,
}: {
  label?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <View style={{ gap: 6 }}>
      {(label || hint) && (
        <View style={s.rowBetween}>
          {label ? <Txt variant="label">{label}</Txt> : <View />}
          {hint ? <Txt variant="dataSm">{hint}</Txt> : null}
        </View>
      )}
      {children}
    </View>
  )
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={c.inkFaint}
      {...props}
      style={[s.input, props.style]}
    />
  )
}

/** Chips horizontales. El activo se rellena de ámbar (= tocable). */
export function Select<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 7, paddingRight: 8 }}
    >
      {options.map((o) => (
        <Chip
          key={o.value}
          label={o.label}
          active={o.value === value}
          onPress={() => onChange(o.value)}
        />
      ))}
    </ScrollView>
  )
}

export function Chip({
  label,
  active,
  locked,
  color,
  onPress,
}: {
  label: string
  active?: boolean
  locked?: boolean
  color?: string
  onPress?: () => void
}) {
  const tint = color ?? c.amber
  return (
    <Springy onPress={onPress} scaleTo={0.93}>
      <View
        style={[
          s.chip,
          active && { backgroundColor: tint, borderColor: tint },
          locked && { opacity: 0.42 },
        ]}
      >
        <Text
          style={{
            fontFamily: active ? family.monoBold : family.monoMed,
            fontSize: 11,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            color: active ? c.night : c.inkFaint,
          }}
        >
          {label}
        </Text>
      </View>
    </Springy>
  )
}

/* ------------------------------------------------------------------ estado */

export function Spinner() {
  return (
    <View style={{ paddingVertical: space(9), alignItems: 'center' }}>
      <ActivityIndicator color={c.amber} />
    </View>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Animated.View entering={FadeIn.duration(motion.enter)} style={s.empty}>
      <Txt variant="h2" center>
        {title}
      </Txt>
      {hint ? (
        <Txt variant="small" center color={c.inkFaint} style={{ marginTop: 6 }}>
          {hint}
        </Txt>
      ) : null}
    </Animated.View>
  )
}

/**
 * Los errores de Supabase (PostgrestError, FunctionsError) son objetos planos,
 * no instancias de Error: sin este mapeo se perdía el mensaje real.
 */
function messageOf(error: unknown): string {
  if (!error) return 'Ocurrió un error.'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object') {
    const e = error as { message?: unknown; details?: unknown; hint?: unknown }
    for (const v of [e.message, e.details, e.hint]) {
      if (typeof v === 'string' && v.trim()) return v
    }
  }
  return 'Ocurrió un error.'
}

export function ErrorText({ error }: { error: unknown }) {
  return (
    <Animated.View entering={FadeIn.duration(motion.quick)} style={s.errorBox}>
      <Txt variant="small" color={c.flag}>
        {messageOf(error)}
      </Txt>
    </Animated.View>
  )
}

/* ------------------------------------------------------------------- sheet */

export function Sheet({
  open,
  onClose,
  title,
  children,
  dismissable = true,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  dismissable?: boolean
}) {
  const insets = useSafeAreaInsets()
  return (
    <RNModal
      visible={open}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => dismissable && onClose()}
    >
      {open && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => dismissable && onClose()}
          />
        </Animated.View>
      )}
      {open && (
        <Animated.View
          entering={SlideInDown.springify().damping(20).stiffness(180)}
          style={[s.sheet, shadow.sheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <View style={s.handle} />
          <View style={s.sheetHead}>
            <Txt variant="h2">{title}</Txt>
            {dismissable && (
              <Pressable onPress={onClose} hitSlop={14}>
                <Txt variant="h2" color={c.inkFaint}>
                  ✕
                </Txt>
              </Pressable>
            )}
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16, gap: 15 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      )}
    </RNModal>
  )
}

/* ------------------------------------------------------------------ estilos */

const s = StyleSheet.create({
  card: {
    backgroundColor: c.board,
    borderRadius: radius.lg,
    padding: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 18,
  },
  btnSm: { paddingVertical: 9, paddingHorizontal: 13 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.board2,
    borderRadius: radius.md,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: c.ink,
    fontFamily: family.body,
    fontSize: 14.5,
  },
  chip: {
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  empty: {
    borderWidth: 1,
    borderColor: c.line,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: 42,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  errorBox: {
    borderLeftWidth: 2.5,
    borderLeftColor: c.flag,
    backgroundColor: c.flagSoft,
    borderRadius: radius.sm,
    padding: 12,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '90%',
    backgroundColor: c.board,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.line,
    marginTop: 10,
  },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: c.lineSoft,
  },
})
