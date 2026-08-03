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

// Warm, muted clinic-pastel rotation — kept soft/desaturated so category
// chips read as calm and coordinated rather than saturated "tech SaaS" hues.
const CATEGORY_COLORS = [
  'bg-[#F3DAD3] text-[#B05F52]', 'bg-[#E1EAE0] text-[#4F6B55]', 'bg-[#F2E6CE] text-[#8A6D1F]',
  'bg-[#F0DCC8] text-[#9C5B33]', 'bg-[#EBDEE6] text-[#7C5170]', 'bg-[#F1E7D8] text-[#7A6650]',
  'bg-[#DCE5D2] text-[#54633F]', 'bg-[#EAD9D2] text-[#8A5240]', 'bg-[#DEE3E6] text-[#4C5B67]',
  'bg-[#F5DFC9] text-[#95582A]', 'bg-[#E6DCE8] text-[#6B4C77]', 'bg-[#DCE8DE] text-[#3F6B4E]',
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
