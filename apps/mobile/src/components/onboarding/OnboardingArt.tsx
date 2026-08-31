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
import { c } from '@/theme'

/** Ilustraciones geométricas on-brand para el onboarding (3 escenas). */
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
        <LinearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={c.sky} stopOpacity={0.25} />
          <Stop offset="1" stopColor={c.sky} stopOpacity={0.03} />
        </LinearGradient>
      </Defs>

      <Circle cx="100" cy="100" r="92" fill="url(#g)" />
      <Circle
        cx="100"
        cy="100"
        r="92"
        stroke={c.border2}
        strokeWidth="1"
        fill="none"
      />

      {scene === 1 && <Scene1 />}
      {scene === 2 && <Scene2 />}
      {scene === 3 && <Scene3 />}
    </Svg>
  )
}

/** Escena 1 — boleta de apuesta con dinero ficticio. */
function Scene1() {
  return (
    <G>
      <Rect
        x="52"
        y="40"
        width="96"
        height="118"
        rx="10"
        fill={c.surface}
        stroke={c.border2}
        strokeWidth="1.5"
      />
      <Rect x="66" y="58" width="52" height="7" rx="3.5" fill={c.textFaint} />
      <Rect x="66" y="76" width="68" height="7" rx="3.5" fill={c.slate700} />
      <Rect x="66" y="94" width="40" height="7" rx="3.5" fill={c.slate700} />
      <Rect
        x="66"
        y="116"
        width="68"
        height="26"
        rx="6"
        fill={c.sky}
        opacity={0.18}
      />
      <SvgText
        x="100"
        y="133"
        fontSize="13"
        fontWeight="700"
        fill={c.sky}
        textAnchor="middle"
      >
        $ ficticio
      </SvgText>
      <Circle cx="139" cy="47" r="15" fill={c.emerald} opacity={0.9} />
      <SvgText
        x="139"
        y="52"
        fontSize="15"
        fontWeight="700"
        fill={c.canvas}
        textAnchor="middle"
      >
        %
      </SvgText>
    </G>
  )
}

/** Escena 2 — evolución de la banca (línea ascendente). */
function Scene2() {
  return (
    <G>
      <Rect
        x="40"
        y="48"
        width="120"
        height="104"
        rx="10"
        fill={c.surface}
        stroke={c.border2}
        strokeWidth="1.5"
      />
      <Polyline
        points="52,132 78,120 100,128 122,92 148,70"
        fill="none"
        stroke={c.sky}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M52 132 L78 120 L100 128 L122 92 L148 70 L148 140 L52 140 Z"
        fill={c.sky}
        opacity={0.12}
      />
      <Circle cx="148" cy="70" r="4.5" fill={c.emerald} />
      <Rect x="52" y="60" width="30" height="6" rx="3" fill={c.slate700} />
    </G>
  )
}

/** Escena 3 — elige 3 ligas (3 activas + resto atenuadas). */
function Scene3() {
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
          fill={c.surface2}
          stroke={c.border2}
          strokeWidth="1"
          opacity={0.5}
        />
      ))}
      {active.map((p, i) => (
        <G key={`a${i}`}>
          <Circle cx={p.x} cy={p.y} r="20" fill={c.sky} opacity={0.16} />
          <Circle
            cx={p.x}
            cy={p.y}
            r="20"
            fill="none"
            stroke={c.sky}
            strokeWidth="2.5"
          />
          <SvgText
            x={p.x}
            y={p.y + 5}
            fontSize="15"
            fontWeight="700"
            fill={c.sky}
            textAnchor="middle"
          >
            ✓
          </SvgText>
        </G>
      ))}
    </G>
  )
}
