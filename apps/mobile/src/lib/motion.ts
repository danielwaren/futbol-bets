import { useEffect, useState } from 'react'
import { AccessibilityInfo } from 'react-native'
import {
  FadeIn,
  FadeInDown,
  type BaseAnimationBuilder,
  type EntryExitAnimationFunction,
} from 'react-native-reanimated'

/**
 * Regla `reduced-motion`: si el usuario pidió menos movimiento en los ajustes
 * del sistema, las animaciones deben reducirse, no ignorarse. Antes no lo
 * respetábamos en ningún sitio.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    let alive = true
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (alive) setReduced(v)
    })
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    )
    return () => {
      alive = false
      sub.remove()
    }
  }, [])

  return reduced
}

type Entering = BaseAnimationBuilder | EntryExitAnimationFunction

/**
 * Entrada escalonada de una lista. Con movimiento reducido se cae a un fundido
 * corto y sin desplazamiento, que sigue comunicando "esto es nuevo" sin marear.
 */
export function enterAt(index: number, reduced: boolean): Entering {
  if (reduced) return FadeIn.duration(120)
  return FadeInDown.delay(index * 45)
    .duration(320)
    .springify()
    .damping(18)
}
