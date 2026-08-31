import { Platform } from 'react-native'
import type { TextStyle, ViewStyle } from 'react-native'

/**
 * "Estadio nocturno": la atmósfera de un partido bajo focos con densidad de datos.
 *
 * Regla de color que sostiene todo el sistema: el ÁMBAR significa "tocable" y el
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
  overlay: 'rgba(4,7,6,0.78)',
} as const

/** Acento por liga: el color con el que se identifica cada competición. */
export const leagueColor: Record<string, string> = {
  chile: '#FF4D4D',
  laliga: '#FF8A3D',
  premier: '#B692FF',
  seriea: '#22D3EE',
  bundesliga: '#FF6B81',
  ligue1: '#4DA3FF',
  primeira: '#35D07F',
  eredivisie: '#FF9F45',
  brasileirao: '#A8E05F',
  argentina: '#7BA8FF',
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
} as const

export const space = (n: number) => n * 4

/**
 * Elevación por sombra, no por borde luminoso: las tarjetas flotan sobre la
 * noche en vez de dibujarse con neón.
 */
export const shadow = {
  card: Platform.select<ViewStyle>({
    android: { elevation: 3 },
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    },
  })!,
  raised: Platform.select<ViewStyle>({
    android: { elevation: 7 },
    default: {
      shadowColor: '#000',
      shadowOpacity: 0.5,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
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
  display: 'Chivo_900Black',
  bold: 'Chivo_700Bold',
  semi: 'Chivo_600SemiBold',
  body: 'Chivo_400Regular',
  light: 'Chivo_300Light',
  mono: 'ChivoMono_400Regular',
  monoMed: 'ChivoMono_500Medium',
  monoBold: 'ChivoMono_700Bold',
} as const

/**
 * Todas las cifras van en Chivo Mono: cuotas, montos y posiciones quedan
 * alineadas en columna en vez de bailar entre filas.
 */
export const type = {
  /** Título de pantalla. */
  screen: {
    fontFamily: family.display,
    fontSize: 26,
    letterSpacing: -0.7,
    color: c.ink,
    textTransform: 'uppercase',
  } as TextStyle,
  /** Nombre de equipo. */
  team: {
    fontFamily: family.bold,
    fontSize: 15.5,
    letterSpacing: -0.2,
    color: c.ink,
    textTransform: 'uppercase',
  } as TextStyle,
  h2: {
    fontFamily: family.bold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: c.ink,
  } as TextStyle,
  body: { fontFamily: family.body, fontSize: 14, color: c.ink } as TextStyle,
  small: { fontFamily: family.body, fontSize: 12.5, color: c.inkDim } as TextStyle,
  /** Etiqueta de marcador: mayúsculas espaciadas, mono. */
  label: {
    fontFamily: family.monoMed,
    fontSize: 10,
    letterSpacing: 1.4,
    color: c.inkFaint,
    textTransform: 'uppercase',
  } as TextStyle,
  /** Cifra grande (banca). */
  figure: {
    fontFamily: family.monoBold,
    fontSize: 32,
    letterSpacing: -1,
    color: c.ink,
  } as TextStyle,
  /** Cifra en línea (cuota, monto). */
  data: { fontFamily: family.monoBold, fontSize: 15, color: c.ink } as TextStyle,
  dataSm: { fontFamily: family.mono, fontSize: 11.5, color: c.inkDim } as TextStyle,
} as const

/** Duraciones y curvas compartidas para que el movimiento se sienta de una pieza. */
export const motion = {
  stagger: 55,
  enter: 420,
  quick: 180,
  spring: { damping: 15, stiffness: 260, mass: 0.6 },
  springSoft: { damping: 18, stiffness: 150 },
} as const
