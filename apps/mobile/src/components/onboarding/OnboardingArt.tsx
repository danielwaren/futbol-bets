import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient,
  Path,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { c, family } from '@/theme'

/** Ilustraciones del onboarding, en el mismo lenguaje que el resto: noche + ámbar. */
export function OnboardingArt({
  scene,
  size = 220,
}: {
  scene: 1 | 2 | 3
  size?: number
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="halo" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={c.amber} stopOpacity={0.22} />
          <Stop offset="1" stopColor={c.amber} stopOpacity={0.02} />
        </LinearGradient>
      </Defs>

      <Circle cx="100" cy="100" r="92" fill="url(#halo)" />
      <Circle cx="100" cy="100" r="92" stroke={c.line} strokeWidth="1" fill="none" />

      {scene === 1 && <Ticket />}
      {scene === 2 && <Curve />}
      {scene === 3 && <Picker />}
    </Svg>
  )
}

/** Boleta con dinero ficticio. */
function Ticket() {
  return (
    <G>
      <Rect x="52" y="40" width="96" height="118" rx="12" fill={c.board} />
      <Rect x="66" y="58" width="52" height="7" rx="3.5" fill={c.inkFaint} />
      <Rect x="66" y="76" width="68" height="7" rx="3.5" fill={c.board3} />
      <Rect x="66" y="94" width="40" height="7" rx="3.5" fill={c.board3} />
      <Rect x="66" y="116" width="68" height="26" rx="7" fill={c.amber} opacity={0.16} />
      <SvgText
        x="100"
        y="134"
        fontSize="13"
        fontFamily={family.monoBold}
        fill={c.amber}
        textAnchor="middle"
      >
        $ ficticio
      </SvgText>
      <Circle cx="139" cy="47" r="15" fill={c.pitch} />
      <SvgText
        x="139"
        y="53"
        fontSize="15"
        fontFamily={family.bold}
        fill={c.night}
        textAnchor="middle"
      >
        %
      </SvgText>
    </G>
  )
}

/** Evolución de la banca. */
function Curve() {
  return (
    <G>
      <Rect x="40" y="48" width="120" height="104" rx="12" fill={c.board} />
      <Path
        d="M52 132 L78 120 L100 128 L122 92 L148 70 L148 140 L52 140 Z"
        fill={c.amber}
        opacity={0.14}
      />
      <Polyline
        points="52,132 78,120 100,128 122,92 148,70"
        fill="none"
        stroke={c.amber}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="148" cy="70" r="4.5" fill={c.pitch} />
      <Rect x="52" y="60" width="30" height="6" rx="3" fill={c.board3} />
    </G>
  )
}

/** Elegir 3 ligas: tres encendidas, el resto apagadas. */
function Picker() {
  const active = [
    { x: 70, y: 74 },
    { x: 130, y: 74 },
    { x: 100, y: 118 },
  ]
  const faded = [
    { x: 58, y: 128 },
    { x: 142, y: 128 },
    { x: 100, y: 56 },
    { x: 64, y: 52 },
  ]
  return (
    <G>
      {faded.map((p, i) => (
        <Circle
          key={`f${i}`}
          cx={p.x}
          cy={p.y}
          r="13"
          fill={c.board2}
          stroke={c.line}
          strokeWidth="1"
          opacity={0.55}
        />
      ))}
      {active.map((p, i) => (
        <G key={`a${i}`}>
          <Circle cx={p.x} cy={p.y} r="20" fill={c.amber} opacity={0.16} />
          <Circle cx={p.x} cy={p.y} r="20" fill="none" stroke={c.amber} strokeWidth="2.5" />
          <Path
            d={`M${p.x - 6} ${p.y} l4.5 4.5 L${p.x + 7} ${p.y - 6}`}
            stroke={c.amber}
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </G>
      ))}
    </G>
  )
}
