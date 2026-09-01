import { Platform } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'

/**
 * "Estadio nocturno": la atmósfera de un partido bajo focos con densidad de datos.
 *
 * Regla de color que sostiene el sistema: el ÁMBAR significa "tocable" y el
 * VERDE/ROJO significan "resultado". Nunca se mezclan — por eso la marca no usa
 * verde y las cifras de P&L no usan ámbar.
 */
export const c = {
  /** Negro con sesgo verde: el rebote del césped bajo las luminarias. */
  night: '#0A0E0D',
  board: '#121917',
  board2: '#18211F',
  board3: '#1E2926',

  line: '#26332F',
  lineSoft: '#1A2523',

  ink: '#EAF0ED',
  inkDim: '#95A6A1',
  inkFaint: '#63756F',

  /** Acento de marca = luz de sodio. Todo lo interactivo. */
  amber: '#FFB627',
  amberInk: '#3A2703',
  amberSoft: 'rgba(255,182,39,0.14)',
  amberLine: 'rgba(255,182,39,0.45)',

  /** Semánticos. Solo para resultado / P&L. */
  pitch: '#35D07F',
  pitchSoft: 'rgba(53,208,127,0.14)',
  flag: '#FF5C5C',
  flagSoft: 'rgba(255,92,92,0.14)',

  white: '#FFFFFF',
  /** Scrim de modal: 40-60% para aislar el contenido (regla blur-purpose). */
  overlay: 'rgba(4,7,6,0.72)',
} as const

/** Acento por liga. Se usa en chips y etiquetas, nunca como barra decorativa. */
export const leagueColor: Record<string, string> = {
  chile: '#FF6B6B',
  laliga: '#FF9F45',
  premier: '#C3A6FF',
  seriea: '#4FD8EE',
  bundesliga: '#FF8095',
  ligue1: '#6BB4FF',
  primeira: '#57DC98',
  eredivisie: '#FFB05C',
  brasileirao: '#B7E86A',
  argentina: '#8FB8FF',
}

/** Código de país: reemplaza a las banderas emoji (regla no-emoji-icons). */
export const leagueCode: Record<string, string> = {
  chile: 'CHL',
  laliga: 'ESP',
  premier: 'ENG',
  seriea: 'ITA',
  bundesliga: 'GER',
  ligue1: 'FRA',
  primeira: 'POR',
  eredivisie: 'NED',
  brasileirao: 'BRA',
  argentina: 'ARG',
}

export const radius = { sm: 8, md: 12, lg: 18, xl: 26, pill: 999 } as const

/** Ritmo 4/8 (regla spacing-scale). */
export const space = (n: number) => n * 4

/** Tamaño mínimo de área táctil: 44pt iOS / 48dp Android. */
export const TAP = Platform.OS === 'android' ? 48 : 44

/** Elevación por sombra, no por borde luminoso. Escala consistente. */
export const shadow = {
  card: Platform.select<ViewStyle>({
    android: { elevation: 2 },
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.36,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 },
    },
  })!,
  raised: Platform.select<ViewStyle>({
    android: { elevation: 6 },
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.48,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 7 },
    },
  })!,
  sheet: Platform.select<ViewStyle>({
    android: { elevation: 16 },
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.6,
      shadowRadius: 28,
      shadowOffset: { width: 0, height: -6 },
    },
  })!,
} as const

/** Familias cargadas en `_layout.tsx` con expo-font. */
export const family = {
  bold: 'IBMPlexSansCondensed_700Bold',
  semi: 'IBMPlexSansCondensed_600SemiBold',
  body: 'IBMPlexSansCondensed_400Regular',
  sans: 'IBMPlexSansCondensed_400Regular',
  mono: 'IBMPlexMono_400Regular',
  monoMed: 'IBMPlexMono_500Medium',
  monoBold: 'IBMPlexMono_700Bold',
} as const

/**
 * Escala tipográfica fija (regla font-scale). Todas las cifras van en la mono
 * con numerales tabulares para que no bailen entre filas.
 */
export const type = {
  /** Título de pantalla. */
  screen: {
    fontFamily: family.bold,
    fontSize: 27,
    letterSpacing: -0.4,
    color: c.ink,
    textTransform: 'uppercase',
  } as TextStyle,
  /** Nombre de equipo: el ancla visual de la tarjeta ahora que no hay escudos. */
  team: {
    fontFamily: family.semi,
    fontSize: 17,
    letterSpacing: -0.1,
    color: c.ink,
    textTransform: 'uppercase',
  } as TextStyle,
  h2: {
    fontFamily: family.bold,
    fontSize: 17,
    letterSpacing: -0.2,
    color: c.ink,
  } as TextStyle,
  /** Cuerpo: 16px mínimo y 1.5 de interlineado (reglas readable-font-size, line-height). */
  body: {
    fontFamily: family.body,
    fontSize: 16,
    lineHeight: 24,
    color: c.ink,
  } as TextStyle,
  small: {
    fontFamily: family.body,
    fontSize: 14,
    lineHeight: 21,
    color: c.inkDim,
  } as TextStyle,
  /** Etiqueta de marcador: mayúsculas espaciadas, mono. */
  label: {
    fontFamily: family.monoMed,
    fontSize: 11,
    letterSpacing: 1.3,
    color: c.inkFaint,
    textTransform: 'uppercase',
  } as TextStyle,
  /** Cifra grande (banca). */
  figure: {
    fontFamily: family.monoBold,
    fontSize: 33,
    letterSpacing: -1.2,
    color: c.ink,
  } as TextStyle,
  /** Cifra en línea (cuota, monto). */
  data: { fontFamily: family.monoBold, fontSize: 15, color: c.ink } as TextStyle,
  dataSm: { fontFamily: family.mono, fontSize: 12.5, color: c.inkDim } as TextStyle,
} as const

/**
 * Tokens de movimiento compartidos, para que todo tenga el mismo ritmo
 * (regla motion-consistency). La salida es más corta que la entrada.
 */
export const motion = {
  stagger: 45,
  enter: 320,
  exit: 200,
  quick: 160,
  spring: { damping: 15, stiffness: 260, mass: 0.6 },
  springSoft: { damping: 18, stiffness: 150 },
} as const
