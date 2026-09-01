import { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { SITE } from '@futbolismo/core'
import { useAuth } from '@/context/AuthContext'
import { Button, Card, Field, Input, Springy, Txt, ErrorText } from '@/components/ui'
import { isExpoGo } from '@/lib/platform'
import { c, family, motion, radius } from '@/theme'

export default function Login() {
  const router = useRouter()
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const [loadingG, setLoadingG] = useState(false)
  const [err, setErr] = useState<unknown>(null)
  const [taps, setTaps] = useState(0)
  const showEmail = __DEV__ || taps >= 5

  const [email, setEmail] = useState(__DEV__ ? 'tester@fantasybets.local' : '')
  const [pass, setPass] = useState(__DEV__ ? 'test123456' : '')
  const [loadingE, setLoadingE] = useState(false)

  return (
    <View style={s.root}>
      {/* haz de foco: la marca antes que el logo */}
      <View style={s.beam} pointerEvents="none" />

      <View style={s.inner}>
        <Animated.View entering={FadeInDown.duration(520)} style={s.brand}>
          <Springy onPress={() => setTaps((t) => t + 1)} scaleTo={0.9}>
            <View style={s.mark}>
              <Txt style={s.markTxt}>F</Txt>
            </View>
          </Springy>
          <Txt style={s.wordmark}>{SITE.appName}</Txt>
          <Txt variant="small" center style={{ lineHeight: 19, maxWidth: 300 }}>
            Diario de banca y análisis de estrategias de apuestas deportivas con
            dinero ficticio.
          </Txt>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(520)}>
          <Card style={{ gap: 13 }}>
            <Button
              title="Continuar con Google"
              loading={loadingG}
              onPress={async () => {
                setLoadingG(true)
                setErr(null)
                try {
                  await signInWithGoogle()
                } catch (e) {
                  setErr(e)
                } finally {
                  setLoadingG(false)
                }
              }}
            />
            {err ? <ErrorText error={err} /> : null}
            <Txt variant="label" size={9} center style={{ lineHeight: 15 }}>
              Solo para mayores de {SITE.minAge} años{'\n'}
              No involucra dinero real ni apuestas reales
            </Txt>
            <View style={s.legal}>
              <Springy onPress={() => router.push('/terminos')}>
                <Txt variant="label" size={9.5} color={c.amber}>
                  Términos
                </Txt>
              </Springy>
              <Springy onPress={() => router.push('/privacidad')}>
                <Txt variant="label" size={9.5} color={c.amber}>
                  Privacidad
                </Txt>
              </Springy>
            </View>
          </Card>
        </Animated.View>

        {showEmail && (
          <Animated.View entering={FadeIn.duration(motion.enter)}>
            <Card style={{ gap: 11 }}>
              <Txt variant="label" size={9}>
                Acceso por email
              </Txt>
              <Field>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </Field>
              <Field>
                <Input
                  value={pass}
                  onChangeText={setPass}
                  placeholder="contraseña"
                  secureTextEntry
                />
              </Field>
              <Button
                variant="ghost"
                size="sm"
                title="Entrar"
                loading={loadingE}
                onPress={async () => {
                  setLoadingE(true)
                  setErr(null)
                  try {
                    await signInWithEmail(email, pass)
                  } catch (e) {
                    setErr(e)
                    setLoadingE(false)
                  }
                }}
              />
            </Card>
          </Animated.View>
        )}

        {isExpoGo && (
          <Txt variant="label" size={8.5} center>
            Expo Go · compras y anuncios se activan en el build nativo
          </Txt>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.night, justifyContent: 'center' },
  beam: {
    position: 'absolute',
    top: -180,
    left: -60,
    right: -60,
    height: 420,
    backgroundColor: c.amber,
    opacity: 0.07,
    borderBottomLeftRadius: 300,
    borderBottomRightRadius: 300,
  },
  inner: { padding: 22, gap: 18 },
  brand: { alignItems: 'center', gap: 12, marginBottom: 6 },
  mark: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: c.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markTxt: {
    fontFamily: family.bold,
    fontSize: 38,
    color: c.amberInk,
    lineHeight: 46,
  },
  wordmark: {
    fontFamily: family.bold,
    fontSize: 30,
    letterSpacing: -1,
    color: c.ink,
    textTransform: 'uppercase',
  },
  legal: { flexDirection: 'row', gap: 18, justifyContent: 'center' },
})
