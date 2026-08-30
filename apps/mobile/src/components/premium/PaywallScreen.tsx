import { Pressable, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMonetization } from '@/context/MonetizationContext'
import type { PurchasesPackage } from '@/lib/purchases'
import { useEntitlements } from '@/hooks/useEntitlements'
import { Sheet, Button, Txt, Spinner, ErrorText } from '@/components/ui'
import { c, radius } from '@/theme'

const PERKS = [
  '10 ligas (vs. 3 del plan free)',
  'Una banca independiente por cada liga',
  'Sin anuncios',
  'Apoyas el desarrollo y el pago de las APIs',
]
const LABEL: Record<string, string> = {
  MONTHLY: 'Mensual',
  ANNUAL: 'Anual',
  LIFETIME: 'Pago único',
}

export function PaywallScreen({
  open,
  onClose,
  reason,
}: {
  open: boolean
  onClose: () => void
  reason?: string
}) {
  const router = useRouter()
  const entitlements = useEntitlements()
  const { storeAvailable, offerings, loadingOfferings, purchase, restore, busy, error } =
    useMonetization()
  const packages: PurchasesPackage[] = offerings?.current?.availablePackages ?? []
  const alreadyPremium = entitlements.plan === 'premium'

  return (
    <Sheet open={open} onClose={onClose} title="Futbolismo Premium">
      {reason && (
        <View style={{ backgroundColor: c.amberBg, borderRadius: radius.md, padding: 10 }}>
          <Txt size={12} color={c.amber}>
            {reason}
          </Txt>
        </View>
      )}

      <View style={{ gap: 8 }}>
        {PERKS.map((p) => (
          <View key={p} style={{ flexDirection: 'row', gap: 8 }}>
            <Txt color={c.emerald}>✓</Txt>
            <Txt style={{ flex: 1 }}>{p}</Txt>
          </View>
        ))}
      </View>

      {alreadyPremium ? (
        <View style={{ backgroundColor: c.emeraldBg, borderRadius: radius.md, padding: 10 }}>
          <Txt color={c.emerald}>Ya tienes Premium activo. ¡Gracias!</Txt>
        </View>
      ) : !storeAvailable ? (
        <Txt size={12} faint>
          La suscripción se compra desde la app publicada en Google Play. En esta
          versión (Expo Go) el paywall es informativo.
        </Txt>
      ) : loadingOfferings ? (
        <Spinner />
      ) : packages.length === 0 ? (
        <Txt size={12} faint>
          No hay planes disponibles ahora mismo.
        </Txt>
      ) : (
        <View style={{ gap: 8 }}>
          {packages.map((pkg) => (
            <Pressable
              key={pkg.identifier}
              disabled={busy}
              onPress={() => void purchase(pkg)}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: c.border2,
                borderRadius: radius.lg,
                padding: 14,
              }}
            >
              <Txt weight="500">{LABEL[pkg.packageType] ?? pkg.product.title}</Txt>
              <Txt weight="600" color={c.sky}>
                {pkg.product.priceString}
              </Txt>
            </Pressable>
          ))}
          {busy && <Spinner />}
        </View>
      )}

      {error ? <ErrorText error={error} /> : null}

      {storeAvailable && !alreadyPremium && (
        <Button
          variant="ghost"
          size="sm"
          title="Restaurar compras"
          onPress={() => void restore()}
        />
      )}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable onPress={() => { onClose(); router.push('/terminos') }}>
          <Txt size={11} color={c.sky}>
            Términos
          </Txt>
        </Pressable>
        <Pressable onPress={() => { onClose(); router.push('/privacidad') }}>
          <Txt size={11} color={c.sky}>
            Privacidad
          </Txt>
        </Pressable>
      </View>

      <Button variant="ghost" title="Cerrar" onPress={onClose} />
    </Sheet>
  )
}
