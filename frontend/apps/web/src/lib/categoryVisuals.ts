import type { LucideIcon } from 'lucide-react'
import {
  Scissors, Sparkles, Stethoscope, Activity, Dumbbell, Waves, Gem, Brush,
  PawPrint, HeartPulse, Flower2, MessageSquare, Apple, Camera, Building2,
} from 'lucide-react'

// Shared between the /isletmeler listing page and the navbar's category
// mega menu, so both render the same icon/colour for a given category.
export const categoryIcons: Record<string, string> = {
  'Kuaför': '✂️',
  'Güzellik Salonu': '💅',
  'Diş Kliniği': '🦷',
  'Fizyoterapi': '🏃',
  'Spor Salonu': '💪',
  'Spa & Masaj': '🧖',
  'Tırnak Salonu': '💎',
  'Dövme Stüdyosu': '🎨',
  'Veteriner': '🐾',
  'Klinik': '🏥',
  'Yoga & Pilates': '🧘',
}

const CATEGORY_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-pink-100 text-pink-700', 'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700', 'bg-orange-100 text-orange-700', 'bg-lime-100 text-lime-700',
  'bg-sky-100 text-sky-700', 'bg-purple-100 text-purple-700', 'bg-cyan-100 text-cyan-700',
]

export function categoryColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length]
}

export function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

// Line-icon set for the navbar's category mega menu — Building2 is the
// fallback for any category name not covered below.
const CATEGORY_LUCIDE_ICONS: Record<string, LucideIcon> = {
  'Kuaför': Scissors,
  'Güzellik Salonu': Sparkles,
  'Diş Kliniği': Stethoscope,
  'Diş Hekimi': Stethoscope,
  'Fizyoterapi': Activity,
  'Spor Salonu': Dumbbell,
  'Kişisel Antrenör': Dumbbell,
  'Spa & Masaj': Waves,
  'Tırnak Salonu': Gem,
  'Dövme': Brush,
  'Dövme Stüdyosu': Brush,
  'Veteriner': PawPrint,
  'Klinik': HeartPulse,
  'Yoga & Pilates': Flower2,
  'Danışmanlık': MessageSquare,
  'Diyetisyen': Apple,
  'Fotoğrafçı': Camera,
}

export function categoryLucideIcon(name: string): LucideIcon {
  return CATEGORY_LUCIDE_ICONS[name] ?? Building2
}
