/**
 * Identidad visual de clubes SIN reproducir escudos registrados.
 *
 * Cada club se dibuja como un disco con sus colores reales y el patrón de su
 * camiseta, más una abreviatura. Los colores no son registrables y la
 * abreviatura se usa de forma descriptiva para referirse al equipo.
 *
 * Los nombres llegan desde The Odds API como texto libre, así que la búsqueda
 * es tolerante (sin acentos, sin prefijos tipo "CF"/"FC") y SIEMPRE hay un
 * resultado: los clubes no catalogados reciben una identidad derivada del
 * nombre, estable entre sesiones.
 */

export type ClubPattern = 'solid' | 'stripes' | 'halves' | 'band' | 'sash'

export interface ClubIdentity {
  /** color principal */
  c1: string
  /** color secundario (patrones distintos de `solid`) */
  c2: string
  pattern: ClubPattern
  /** 2-4 caracteres */
  abbr: string
  /** true = el texto va oscuro porque el fondo es claro */
  darkInk: boolean
}

interface Entry {
  c1: string
  c2?: string
  pattern?: ClubPattern
  abbr: string
  darkInk?: boolean
}

/** Palabras que no aportan a la identificación del club. */
const NOISE = new Set([
  'fc', 'cf', 'cd', 'ca', 'ac', 'as', 'sc', 'sd', 'ud', 'rc', 'rcd', 'afc',
  'club', 'de', 'del', 'la', 'las', 'los', 'el', 'do', 'da', 'e',
  'deportivo', 'deportes', 'social', 'atletico', 'atletica', 'futbol',
  'football', 'united', 'city', 'town', 'calcio', 'sport', 'sportif',
  'sportive', 'ssc', 'ssd', 'us', 'usc', 'sv', 'tsv', 'vfl', 'vfb', 'fsv',
  'bsc', 'sge', 'sk', 'ec', 'se', 'cr', 'sad',
])

/**
 * Catálogo curado. Cubre a fondo las ligas del trío free por defecto (Chile,
 * LaLiga, Premier) y los clubes grandes del resto.
 */
const CLUBS: Record<string, Entry> = {
  // ---------- Chile ----------
  'colo colo': { c1: '#FFFFFF', c2: '#0B0B0B', pattern: 'stripes', abbr: 'CC', darkInk: true },
  'universidad de chile': { c1: '#0B4EA2', abbr: 'UCH' },
  'universidad catolica': { c1: '#FFFFFF', c2: '#1B3A8C', pattern: 'sash', abbr: 'UC', darkInk: true },
  'union espanola': { c1: '#E11D2E', abbr: 'UNE' },
  'palestino': { c1: '#0B7A3B', c2: '#E11D2E', pattern: 'band', abbr: 'PAL' },
  'audax italiano': { c1: '#1E9E4A', abbr: 'AUD' },
  'nublense': { c1: '#E11D2E', c2: '#F5F5F5', pattern: 'halves', abbr: 'NUB' },
  'cobresal': { c1: '#F5F5F5', c2: '#111111', pattern: 'band', abbr: 'COB', darkInk: true },
  'everton': { c1: '#F0A500', abbr: 'EVE', darkInk: true },
  'huachipato': { c1: '#1B3A8C', c2: '#111111', pattern: 'stripes', abbr: 'HUA' },
  'o higgins': { c1: '#0B4EA2', c2: '#8FC7FF', pattern: 'stripes', abbr: 'OHI' },
  'coquimbo unido': { c1: '#F5C518', c2: '#111111', pattern: 'halves', abbr: 'COQ' },
  'deportes iquique': { c1: '#1C3F94', c2: '#E11D2E', pattern: 'band', abbr: 'IQU' },
  'universidad de concepcion': { c1: '#7A1F2B', abbr: 'UDC' },
  'union la calera': { c1: '#B01C2E', c2: '#F5F5F5', pattern: 'halves', abbr: 'CAL' },
  'deportes limache': { c1: '#1E7A4A', abbr: 'LIM' },
  'deportes la serena': { c1: '#B01C2E', c2: '#F5C518', pattern: 'band', abbr: 'SER' },
  'union san felipe': { c1: '#B01C2E', abbr: 'USF' },

  // ---------- LaLiga ----------
  'real madrid': { c1: '#F2F2F2', abbr: 'RMA', darkInk: true },
  'barcelona': { c1: '#A50044', c2: '#004D98', pattern: 'stripes', abbr: 'BAR' },
  'atletico madrid': { c1: '#FFFFFF', c2: '#CB3524', pattern: 'stripes', abbr: 'ATM', darkInk: true },
  'sevilla': { c1: '#F5F5F5', c2: '#D81920', pattern: 'band', abbr: 'SEV', darkInk: true },
  'real betis': { c1: '#00954C', c2: '#FFFFFF', pattern: 'stripes', abbr: 'BET' },
  'valencia': { c1: '#F5F5F5', c2: '#EE8707', pattern: 'band', abbr: 'VAL', darkInk: true },
  'villarreal': { c1: '#FFE667', abbr: 'VIL', darkInk: true },
  'athletic bilbao': { c1: '#EE2523', c2: '#FFFFFF', pattern: 'stripes', abbr: 'ATH' },
  'real sociedad': { c1: '#0067B1', c2: '#FFFFFF', pattern: 'stripes', abbr: 'RSO' },
  'girona': { c1: '#CD2534', c2: '#FFFFFF', pattern: 'stripes', abbr: 'GIR' },
  'celta vigo': { c1: '#8AC3EE', abbr: 'CEL', darkInk: true },
  'osasuna': { c1: '#0A346F', c2: '#D91A21', pattern: 'halves', abbr: 'OSA' },
  'rayo vallecano': { c1: '#FFFFFF', c2: '#E53027', pattern: 'sash', abbr: 'RAY', darkInk: true },
  'mallorca': { c1: '#E20613', c2: '#000000', pattern: 'halves', abbr: 'MLL' },
  'getafe': { c1: '#005999', abbr: 'GET' },
  'espanyol': { c1: '#FFFFFF', c2: '#007FC8', pattern: 'stripes', abbr: 'ESP', darkInk: true },
  'alaves': { c1: '#0761AF', c2: '#FFFFFF', pattern: 'stripes', abbr: 'ALA' },
  'las palmas': { c1: '#FFE400', c2: '#0055A5', pattern: 'band', abbr: 'LPA', darkInk: true },
  'leganes': { c1: '#005BAC', c2: '#FFFFFF', pattern: 'stripes', abbr: 'LEG' },
  'valladolid': { c1: '#921A80', c2: '#FFFFFF', pattern: 'stripes', abbr: 'VLL' },

  // ---------- Premier ----------
  'manchester city': { c1: '#6CABDD', abbr: 'MCI', darkInk: true },
  'manchester united': { c1: '#DA291C', abbr: 'MUN' },
  'liverpool': { c1: '#C8102E', abbr: 'LIV' },
  'arsenal': { c1: '#EF0107', c2: '#FFFFFF', pattern: 'band', abbr: 'ARS' },
  'chelsea': { c1: '#034694', abbr: 'CHE' },
  'tottenham hotspur': { c1: '#F2F2F2', c2: '#132257', pattern: 'band', abbr: 'TOT', darkInk: true },
  'newcastle united': { c1: '#241F20', c2: '#FFFFFF', pattern: 'stripes', abbr: 'NEW' },
  'aston villa': { c1: '#95BFE5', c2: '#670E36', pattern: 'band', abbr: 'AVL' },
  'west ham united': { c1: '#7A263A', c2: '#1BB1E7', pattern: 'band', abbr: 'WHU' },
  'brighton and hove albion': { c1: '#0057B8', c2: '#FFFFFF', pattern: 'stripes', abbr: 'BHA' },
  'everton fc': { c1: '#003399', abbr: 'EVE' },
  'nottingham forest': { c1: '#DD0000', abbr: 'NFO' },
  'brentford': { c1: '#E30613', c2: '#FFFFFF', pattern: 'stripes', abbr: 'BRE' },
  'crystal palace': { c1: '#1B458F', c2: '#C4122E', pattern: 'stripes', abbr: 'CRY' },
  'fulham': { c1: '#F5F5F5', c2: '#000000', pattern: 'band', abbr: 'FUL', darkInk: true },
  'wolverhampton wanderers': { c1: '#FDB913', abbr: 'WOL', darkInk: true },
  'bournemouth': { c1: '#DA291C', c2: '#000000', pattern: 'stripes', abbr: 'BOU' },
  'leicester': { c1: '#003090', abbr: 'LEI' },
  'ipswich town': { c1: '#3A64A3', abbr: 'IPS' },
  'southampton': { c1: '#D71920', c2: '#FFFFFF', pattern: 'stripes', abbr: 'SOU' },

  // ---------- Serie A ----------
  'inter milan': { c1: '#0068A8', c2: '#111111', pattern: 'stripes', abbr: 'INT' },
  'ac milan': { c1: '#FB090B', c2: '#111111', pattern: 'stripes', abbr: 'MIL' },
  'juventus': { c1: '#FFFFFF', c2: '#111111', pattern: 'stripes', abbr: 'JUV', darkInk: true },
  'napoli': { c1: '#12A0D7', abbr: 'NAP' },
  'roma': { c1: '#8E1F2F', c2: '#F0BC42', pattern: 'band', abbr: 'ROM' },
  'lazio': { c1: '#87D8F7', abbr: 'LAZ', darkInk: true },
  'atalanta': { c1: '#1D71B8', c2: '#111111', pattern: 'stripes', abbr: 'ATA' },
  'fiorentina': { c1: '#592C82', abbr: 'FIO' },
  'bologna': { c1: '#9F1B32', c2: '#1A2B5E', pattern: 'halves', abbr: 'BOL' },
  'torino': { c1: '#8B1A1A', abbr: 'TOR' },

  // ---------- Bundesliga ----------
  'bayern munich': { c1: '#DC052D', abbr: 'BAY' },
  'borussia dortmund': { c1: '#FDE100', c2: '#111111', pattern: 'band', abbr: 'BVB', darkInk: true },
  'bayer leverkusen': { c1: '#E32221', c2: '#111111', pattern: 'halves', abbr: 'B04' },
  'rb leipzig': { c1: '#FFFFFF', c2: '#DD0741', pattern: 'sash', abbr: 'RBL', darkInk: true },
  'eintracht frankfurt': { c1: '#E1000F', c2: '#111111', pattern: 'halves', abbr: 'SGE' },
  'vfb stuttgart': { c1: '#FFFFFF', c2: '#E32219', pattern: 'band', abbr: 'VFB', darkInk: true },
  'borussia monchengladbach': { c1: '#FFFFFF', c2: '#111111', pattern: 'band', abbr: 'BMG', darkInk: true },
  'werder bremen': { c1: '#1D9053', abbr: 'SVW' },
  'wolfsburg': { c1: '#65B32E', abbr: 'WOB' },
  'hoffenheim': { c1: '#1C63B7', abbr: 'TSG' },

  // ---------- Ligue 1 ----------
  'paris saint germain': { c1: '#004170', c2: '#DA291C', pattern: 'band', abbr: 'PSG' },
  'marseille': { c1: '#F0FCFF', c2: '#2FAEE0', pattern: 'band', abbr: 'OM', darkInk: true },
  'lyon': { c1: '#FFFFFF', c2: '#1B3A8C', pattern: 'band', abbr: 'OL', darkInk: true },
  'monaco': { c1: '#E63329', c2: '#FFFFFF', pattern: 'halves', abbr: 'ASM' },
  'lille': { c1: '#E01E13', c2: '#0C2244', pattern: 'halves', abbr: 'LIL' },
  'nice': { c1: '#E4141C', c2: '#111111', pattern: 'halves', abbr: 'NIC' },
  'lens': { c1: '#FFE500', c2: '#E4141C', pattern: 'stripes', abbr: 'RCL', darkInk: true },
  'rennes': { c1: '#E23237', c2: '#111111', pattern: 'stripes', abbr: 'SRF' },

  // ---------- Primeira ----------
  'benfica': { c1: '#E30613', abbr: 'BEN' },
  'porto': { c1: '#0055A5', c2: '#FFFFFF', pattern: 'stripes', abbr: 'POR' },
  'sporting cp': { c1: '#008057', c2: '#FFFFFF', pattern: 'stripes', abbr: 'SCP' },
  'braga': { c1: '#C1272D', abbr: 'BRA' },
  'vitoria guimaraes': { c1: '#FFFFFF', c2: '#111111', pattern: 'stripes', abbr: 'VIT', darkInk: true },

  // ---------- Eredivisie ----------
  'ajax': { c1: '#FFFFFF', c2: '#D2122E', pattern: 'band', abbr: 'AJA', darkInk: true },
  'psv eindhoven': { c1: '#EE2E24', c2: '#FFFFFF', pattern: 'stripes', abbr: 'PSV' },
  'feyenoord': { c1: '#FFFFFF', c2: '#E30613', pattern: 'halves', abbr: 'FEY', darkInk: true },
  'az alkmaar': { c1: '#E4022D', abbr: 'AZ' },
  'twente': { c1: '#E30613', abbr: 'TWE' },

  // ---------- Brasileirão ----------
  'flamengo': { c1: '#E4002B', c2: '#111111', pattern: 'stripes', abbr: 'FLA' },
  'palmeiras': { c1: '#006437', abbr: 'PAL' },
  'corinthians': { c1: '#FFFFFF', c2: '#111111', pattern: 'band', abbr: 'COR', darkInk: true },
  'sao paulo': { c1: '#FFFFFF', c2: '#E4002B', pattern: 'band', abbr: 'SAO', darkInk: true },
  'fluminense': { c1: '#7A1E3C', c2: '#0B6B3A', pattern: 'stripes', abbr: 'FLU' },
  'botafogo': { c1: '#111111', c2: '#FFFFFF', pattern: 'stripes', abbr: 'BOT' },
  'gremio': { c1: '#0D80BF', c2: '#111111', pattern: 'stripes', abbr: 'GRE' },
  'internacional': { c1: '#E5050F', abbr: 'INT' },
  'atletico mineiro': { c1: '#111111', c2: '#FFFFFF', pattern: 'stripes', abbr: 'CAM' },
  'cruzeiro': { c1: '#003399', abbr: 'CRU' },
  'vasco da gama': { c1: '#111111', c2: '#FFFFFF', pattern: 'sash', abbr: 'VAS' },
  'santos': { c1: '#F5F5F5', c2: '#111111', pattern: 'band', abbr: 'SAN', darkInk: true },

  // ---------- Argentina ----------
  'boca juniors': { c1: '#002E62', c2: '#FFC72C', pattern: 'band', abbr: 'BOC' },
  'river plate': { c1: '#FFFFFF', c2: '#E1122C', pattern: 'sash', abbr: 'RIV', darkInk: true },
  'racing club': { c1: '#7EC5EE', c2: '#FFFFFF', pattern: 'stripes', abbr: 'RAC', darkInk: true },
  'independiente': { c1: '#E10600', abbr: 'IND' },
  'san lorenzo': { c1: '#0A2A6B', c2: '#B01C2E', pattern: 'stripes', abbr: 'SLO' },
  'velez sarsfield': { c1: '#FFFFFF', c2: '#0A2A6B', pattern: 'sash', abbr: 'VEL', darkInk: true },
  'estudiantes': { c1: '#E1122C', c2: '#FFFFFF', pattern: 'stripes', abbr: 'EST' },
  'newells old boys': { c1: '#E1122C', c2: '#111111', pattern: 'halves', abbr: 'NOB' },
  'rosario central': { c1: '#0A56A5', c2: '#FFD100', pattern: 'stripes', abbr: 'ROS' },
  'talleres': { c1: '#0A56A5', c2: '#FFFFFF', pattern: 'stripes', abbr: 'TAL' },
}

/** Paleta de reserva: tonos que funcionan sobre la noche verdosa. */
const FALLBACK_COLORS = [
  '#4DA3FF', '#FF6B81', '#35D07F', '#B692FF', '#22D3EE',
  '#FF8A3D', '#A8E05F', '#FF4D4D', '#7BA8FF', '#F0A500',
]
const FALLBACK_PATTERNS: ClubPattern[] = ['solid', 'stripes', 'halves', 'band', 'sash']

/** Sin acentos, sin puntuación, en minúsculas. */
function normalize(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function significantWords(normalized: string): string[] {
  const words = normalized.split(' ').filter((w) => w && !NOISE.has(w))
  return words.length ? words : normalized.split(' ').filter(Boolean)
}

/** Hash estable (djb2) para que un club sin catalogar se vea siempre igual. */
function hash(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function deriveAbbr(normalized: string): string {
  const words = significantWords(normalized)
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }
  return (words[0] ?? normalized).slice(0, 3).toUpperCase()
}

const cache = new Map<string, ClubIdentity>()

/**
 * Identidad visual de un equipo. Nunca falla: si no está catalogado, deriva
 * una identidad estable a partir del nombre.
 */
export function clubIdentity(teamName: string): ClubIdentity {
  const cached = cache.get(teamName)
  if (cached) return cached

  const norm = normalize(teamName)
  let entry = CLUBS[norm]

  // Coincidencia por palabras significativas: "CD Universidad Catolica" -> "universidad catolica"
  if (!entry) {
    const key = significantWords(norm).join(' ')
    entry = CLUBS[key]
  }
  // Último intento: alguna clave contenida en el nombre (o al revés).
  if (!entry) {
    const found = Object.keys(CLUBS).find(
      (k) => norm.includes(k) || (k.length > 6 && k.includes(norm)),
    )
    if (found) entry = CLUBS[found]
  }

  const identity: ClubIdentity = entry
    ? {
        c1: entry.c1,
        c2: entry.c2 ?? entry.c1,
        pattern: entry.pattern ?? 'solid',
        abbr: entry.abbr,
        darkInk: entry.darkInk ?? false,
      }
    : (() => {
        const h = hash(norm)
        const c1 = FALLBACK_COLORS[h % FALLBACK_COLORS.length]
        const pattern = FALLBACK_PATTERNS[(h >> 3) % FALLBACK_PATTERNS.length]
        return {
          c1,
          c2: pattern === 'solid' ? c1 : '#F5F5F5',
          pattern,
          abbr: deriveAbbr(norm),
          darkInk: false,
        }
      })()

  cache.set(teamName, identity)
  return identity
}
