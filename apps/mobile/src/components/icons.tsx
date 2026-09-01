/**
 * Único set de iconos: Lucide, vectorial y con grosor de trazo uniforme.
 * Reemplaza a los emoji, que dependen de la fuente del sistema, se ven distintos
 * en cada Android y no aceptan tokens de color.
 *
 * Se importa icono por icono y NO desde 'lucide-react-native': el índice
 * reexporta ~1600 iconos y Metro los empaqueta todos (+1,6 MB de bundle).
 */
import BarChart3 from 'lucide-react-native/icons/chart-column'
import CalendarDays from 'lucide-react-native/icons/calendar-days'
import Check from 'lucide-react-native/icons/check'
import ChevronLeft from 'lucide-react-native/icons/chevron-left'
import ChevronRight from 'lucide-react-native/icons/chevron-right'
import CircleUser from 'lucide-react-native/icons/circle-user'
import ClipboardList from 'lucide-react-native/icons/clipboard-list'
import Clock3 from 'lucide-react-native/icons/clock-3'
import Lock from 'lucide-react-native/icons/lock'
import Pencil from 'lucide-react-native/icons/pencil'
import RotateCcw from 'lucide-react-native/icons/rotate-ccw'
import Table2 from 'lucide-react-native/icons/table-2'
import Ticket from 'lucide-react-native/icons/ticket'
import Trash2 from 'lucide-react-native/icons/trash-2'
import TrendingUp from 'lucide-react-native/icons/trending-up'
import X from 'lucide-react-native/icons/x'
import { c } from '@/theme'

export const Icon = {
  matches: Ticket,
  table: Table2,
  history: ClipboardList,
  stats: BarChart3,
  account: CircleUser,
  calendar: CalendarDays,
  prev: ChevronLeft,
  next: ChevronRight,
  check: Check,
  close: X,
  lock: Lock,
  pending: Clock3,
  edit: Pencil,
  delete: Trash2,
  reopen: RotateCcw,
  trend: TrendingUp,
}

export const ICON_STROKE = 1.75
export const ICON_SIZE = { sm: 16, md: 20, lg: 24 } as const

/** Props por defecto para que todos los iconos compartan trazo y color. */
export function iconProps(size: number = ICON_SIZE.md, color: string = c.inkDim) {
  return { size, color, strokeWidth: ICON_STROKE }
}
