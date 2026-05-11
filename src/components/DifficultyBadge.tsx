import type { Difficulty } from '../types'
import { difficultyLabel, useI18n } from '../i18n'

const config: Record<Difficulty, { label: string; cls: string }> = {
  BEGINNER:     { label: 'Beginner',     cls: 'bg-green-900/50 text-green-300' },
  INTERMEDIATE: { label: 'Intermediate', cls: 'bg-blue-900/50 text-blue-300' },
  ADVANCED:     { label: 'Advanced',     cls: 'bg-purple-900/50 text-purple-300' },
  ELITE:        { label: 'Elite',        cls: 'bg-red-900/50 text-red-300' },
}

export default function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const { language } = useI18n()
  const { label, cls } = config[difficulty]
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${cls}`}>{difficultyLabel(difficulty, label, language)}</span>
  )
}
