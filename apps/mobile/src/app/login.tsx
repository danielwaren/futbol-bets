import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { SITE } from '@futbolismo/core'
import { useAuth } from '@/context/AuthContext'
import { Button, Card, Field, Input, Txt, ErrorText } from '@/components/ui'
import { isExpoGo } from '@/lib/platform'
import { c } from '@/theme'

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
    <View style={{ flex: 1, backgroundColor: c.canvas, justifyContent: 'center', padding: 20, gap: 20 }}>
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Pressable onPress={() => setTaps((t) => t + 1)}>
          <Txt size={40}>📊</Txt>
        </Pressable>
        <Txt weight="700" size={22}>
          {SITE.appName}
        </Txt>
        <Txt size={13} dim center>
          Diario de banca y análisis de estrategias de apuestas deportivas con
          dinero ficticio.
        </Txt>
      </View>

      <Card style={{ gap: 12 }}>
        <Button
          variant="secondary"
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
        <Txt size={11} faint center>
          Solo para mayores de {SITE.minAge} años. No involucra dinero real ni
          apuestas reales.
        </Txt>
        <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'center' }}>
          <Pressable onPress={() => router.push('/terminos')}>
            <Txt size={11} color={c.sky}>
              Términos
            </Txt>
          </Pressable>
          <Pressable onPress={() => router.push('/privacidad')}>
            <Txt size={11} color={c.sky}>
              Privacidad
            </Txt>
          </Pressable>
        </View>
      </Card>

      {showEmail && (
        <Card style={{ gap: 10 }}>
          <Txt size={10} faint>
            ACCESO POR EMAIL
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
            <Input value={pass} onChangeText={setPass} placeholder="contraseña" secureTextEntry />
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
      )}
      {isExpoGo && (
        <Txt size={10} faint center>
          Expo Go · las compras y anuncios se activan en el build nativo
        </Txt>
      )}
    </View>
  )
}
