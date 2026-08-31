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
  type TextInputProps,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { c, radius, space } from '@/theme'

export function Txt({
  children,
  style,
  dim,
  faint,
  size,
  weight,
  color,
  center,
  numberOfLines,
}: {
  children: ReactNode
  style?: object
  dim?: boolean
  faint?: boolean
  size?: number
  weight?: '400' | '500' | '600' | '700'
  color?: string
  center?: boolean
  numberOfLines?: number
}) {
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        {
          color: color ?? (faint ? c.textFaint : dim ? c.textDim : c.text),
          fontSize: size ?? 14,
          fontWeight: weight ?? '400',
          textAlign: center ? 'center' : 'auto',
        },
        style,
      ]}
    >
      {children}
    </Text>
  )
}

export function Card({
  children,
  style,
}: {
  children: ReactNode
  style?: object
}) {
  return <View style={[s.card, style]}>{children}</View>
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
const BTN: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: c.sky, fg: '#04121f' },
  secondary: { bg: c.slate700, fg: c.text },
  ghost: { bg: 'transparent', fg: c.textDim, border: c.border2 },
  danger: { bg: c.rose, fg: '#2b0a12', border: undefined },
  success: { bg: c.emerald, fg: '#04231a' },
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
  style?: object
  left?: ReactNode
}) {
  const v = BTN[variant]
  const isOff = disabled || loading
  return (
    <Pressable
      onPress={onPress}
      disabled={isOff}
      style={({ pressed }) => [
        s.btn,
        size === 'sm' && s.btnSm,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? 'transparent',
          borderWidth: v.border ? 1 : 0,
          opacity: isOff ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} size="small" />
      ) : (
        <>
          {left}
          <Text
            style={{
              color: v.fg,
              fontWeight: '600',
              fontSize: size === 'sm' ? 12 : 14,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  )
}

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
    <View style={{ gap: 4 }}>
      {(label || hint) && (
        <View style={s.row}>
          {label && (
            <Txt size={11} weight="500" dim>
              {label}
            </Txt>
          )}
          {hint && (
            <Txt size={11} faint>
              {hint}
            </Txt>
          )}
        </View>
      )}
      {children}
    </View>
  )
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={c.textFaint}
      {...props}
      style={[s.input, props.style]}
    />
  )
}

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
      contentContainerStyle={{ gap: 6 }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[s.chip, active && s.chipActive]}
          >
            <Txt size={12} color={active ? c.sky : c.textDim}>
              {o.label}
            </Txt>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

export function Spinner() {
  return (
    <View style={{ paddingVertical: space(8), alignItems: 'center' }}>
      <ActivityIndicator color={c.sky} />
    </View>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={s.empty}>
      <Txt weight="600" center>
        {title}
      </Txt>
      {hint && (
        <Txt size={12} faint center style={{ marginTop: 4 }}>
          {hint}
        </Txt>
      )}
    </View>
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
  const msg = messageOf(error)
  return (
    <View style={s.errorBox}>
      <Txt size={13} color={c.rose}>
        {msg}
      </Txt>
    </View>
  )
}

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
      animationType="slide"
      onRequestClose={() => dismissable && onClose()}
    >
      <Pressable
        style={s.backdrop}
        onPress={() => dismissable && onClose()}
      />
      <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.sheetHandle} />
        <View style={s.sheetHead}>
          <Txt weight="700" size={16}>
            {title}
          </Txt>
          {dismissable && (
            <Pressable onPress={onClose} hitSlop={12}>
              <Txt size={20} dim>
                ✕
              </Txt>
            </Pressable>
          )}
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, gap: 14 }}
        >
          {children}
        </ScrollView>
      </View>
    </RNModal>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: c.card,
    borderColor: c.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  btnSm: { paddingVertical: 8, paddingHorizontal: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    borderWidth: 1,
    borderColor: c.border2,
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: c.text,
    fontSize: 14,
  },
  chip: {
    borderWidth: 1,
    borderColor: c.border2,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: { borderColor: c.sky, backgroundColor: c.skyBg },
  empty: {
    borderWidth: 1,
    borderColor: c.border2,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  errorBox: {
    borderWidth: 1,
    borderColor: 'rgba(159,18,57,0.6)',
    backgroundColor: 'rgba(76,5,25,0.4)',
    borderRadius: radius.md,
    padding: 12,
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,6,23,0.7)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '90%',
    backgroundColor: c.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: c.border2,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border2,
    marginTop: 8,
  },
  sheetHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
})
