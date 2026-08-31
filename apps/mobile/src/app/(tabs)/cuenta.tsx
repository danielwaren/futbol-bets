import { useState } from 'react'
import { Alert, Image, Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  formatDateTime,
  LEAGUES,
  PLAY_SUBSCRIPTIONS_URL,
  SITE,
  supabase,
} from '@futbolismo/core'
import { Screen } from '@/components/Screen'
import { LeagueLogo } from '@/components/leagues/LeagueLogo'
import { Button, Card, Txt, ErrorText } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { useProfile } from '@/hooks/useProfile'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useMonetization } from '@/context/MonetizationContext'
import { usePaywall } from '@/context/PaywallContext'
import { openExternal } from '@/lib/external'
import { c } from '@/theme'

export default function Account() {
  const router = useRouter()
  const { signOut } = useAuth()
  const { data: profile } = useProfile()
  const entitlements = useEntitlements()
  const { storeAvailable, restore, busy } = useMonetization()
  const { openPaywall } = usePaywall()
  const [error, setError] = useState<unknown>(null)
  const [deleting, setDeleting] = useState(false)

  function confirmDelete() {
    Alert.alert(
      'Eliminar cuenta',
      'Se borrarán tu perfil, todas tus bancas y apuestas. Es permanente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true)
            setError(null)
            try {
              const { error: e } = await supabase.functions.invoke('delete-account', {
                body: {},
              })
              if (e) throw e
              await signOut()
            } catch (e) {
              setError(e)
              setDeleting(false)
            }
          },
        },
      ],
    )
  }

  return (
    <Screen title="Cuenta" subtitle="Perfil, suscripción y datos">
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {profile?.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: c.slate700,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt>{(profile?.displayName ?? '?').slice(0, 1).toUpperCase()}</Txt>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Txt weight="600">{profile?.displayName ?? 'Cuenta'}</Txt>
            <Txt size={12} faint>
              {profile?.email}
            </Txt>
          </View>
        </View>
      </Card>

      <Card style={{ gap: 10 }}>
        <Txt weight="600">
          Plan {entitlements.plan === 'premium' ? 'Premium' : 'Free'}
        </Txt>
        {entitlements.plan === 'premium' && profile?.planExpiresAt && (
          <Txt size={12} faint>
            Renueva/expira el {formatDateTime(profile.planExpiresAt)}
          </Txt>
        )}
        {entitlements.plan !== 'premium' && (
          <Button size="sm" title="Mejorar a Premium" onPress={() => openPaywall()} />
        )}
        {storeAvailable ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              title="Gestionar suscripción"
              onPress={() => openExternal(PLAY_SUBSCRIPTIONS_URL)}
            />
            <Button
              variant="ghost"
              size="sm"
              title="Restaurar compras"
              disabled={busy}
              onPress={() => void restore()}
            />
          </View>
        ) : (
          <Txt size={12} faint>
            La suscripción se gestiona desde la app publicada en Google Play.
          </Txt>
        )}
      </Card>

      {!entitlements.isPremium && (
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Txt weight="600" style={{ flex: 1 }}>
              Mis ligas gratis
            </Txt>
            <Button
              size="sm"
              variant="secondary"
              title="Cambiar"
              onPress={() => router.push('/elegir-ligas')}
            />
          </View>
          {entitlements.freeLeagues ? (
            <View style={{ flexDirection: 'row', gap: 14 }}>
              {entitlements.freeLeagues.map((id) => (
                <View key={id} style={{ alignItems: 'center', gap: 4 }}>
                  <LeagueLogo league={LEAGUES[id]} size={44} />
                  <Txt size={10} faint>
                    {LEAGUES[id].shortLabel}
                  </Txt>
                </View>
              ))}
            </View>
          ) : (
            <Txt size={12} faint>
              Todavía no eliges tus 3 ligas.
            </Txt>
          )}
        </Card>
      )}

      <Card style={{ gap: 12 }}>
        <Pressable onPress={() => router.push('/onboarding')}>
          <Txt>Ver tutorial de nuevo</Txt>
        </Pressable>
        <Pressable onPress={() => router.push('/privacidad')}>
          <Txt>Política de privacidad</Txt>
        </Pressable>
        <Pressable onPress={() => router.push('/terminos')}>
          <Txt>Términos de uso</Txt>
        </Pressable>
        <Pressable onPress={() => openExternal(`mailto:${SITE.supportEmail}`)}>
          <Txt>Contacto y soporte</Txt>
        </Pressable>
      </Card>

      <Card style={{ gap: 10 }}>
        <Button variant="ghost" title="Cerrar sesión" onPress={() => void signOut()} />
        <Button
          variant="ghost"
          title="Eliminar cuenta"
          loading={deleting}
          style={{ borderColor: 'rgba(159,18,57,0.5)' }}
          onPress={confirmDelete}
        />
        {error ? <ErrorText error={error} /> : null}
      </Card>
    </Screen>
  )
}
