import { NavLink } from 'react-router-dom'
import { House, CalendarDays, BookOpen, Settings } from 'lucide-react'
import { useI18n } from '../i18n'

export default function BottomNav() {
  const { t } = useI18n()
  const tabs = [
    { to: '/', label: t('Home'), Icon: House, end: true },
    { to: '/sessions', label: t('Sessions'), Icon: CalendarDays, end: false },
    { to: '/techniques', label: t('Techniques'), Icon: BookOpen, end: false },
    { to: '/settings', label: t('Settings'), Icon: Settings, end: false },
  ]

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-zinc-900 border-t border-zinc-800 flex safe-bottom z-50">
      {tabs.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-1 text-xs font-medium transition-colors ${
              isActive ? 'text-gold' : 'text-zinc-500'
            }`
          }
        >
          <Icon size={24} strokeWidth={2} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
