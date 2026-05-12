import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, ChevronUp, ChevronDown } from 'lucide-react'
import { db } from '../db/database'
import type { Club } from '../types'
import { useI18n } from '../i18n'

const inputCls =
  'w-full bg-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600'

export default function ClubsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { language, t } = useI18n()
  const returnContext = location.state as { returnTo?: string; returnState?: unknown } | null
  const returnTo = returnContext?.returnTo
  const returnState = returnContext?.returnState

  const navigateBack = () => {
    if (returnTo) {
      navigate(returnTo, { state: returnState })
      return
    }
    navigate(-1)
  }
  const clubs = useLiveQuery(
    () => db.clubs.orderBy('sortOrder').toArray(),
    [],
    [] as Club[],
  )
  const [newClubName, setNewClubName] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleAdd = async () => {
    const name = newClubName.trim()
    if (!name) return
    const last = await db.clubs.orderBy('sortOrder').last()
    const sortOrder = typeof last?.sortOrder === 'number' ? last.sortOrder + 1 : 1
    await db.clubs.add({ name, sortOrder })
    setNewClubName('')
    if (returnTo) navigate(returnTo, { state: returnState })
  }

  const handleMove = async (index: number, direction: -1 | 1) => {
    if (!clubs?.length) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= clubs.length) return
    const current = clubs[index]
    const target = clubs[targetIndex]
    await db.clubs.bulkPut([
      { ...current, sortOrder: target.sortOrder },
      { ...target, sortOrder: current.sortOrder },
    ])
  }

  const handleDelete = async (club: Club) => {
    if (!club.id) return
    const message = language === 'es'
      ? `¿Eliminar ${club.name}?\nLas sesiones conservarán sus datos pero ya no quedarán asociadas a esta academia.`
      : `Delete ${club.name}?\nSessions will keep their data but will no longer be associated with this club.`
    if (!window.confirm(message)) return
    await db.sessions.where('clubId').equals(club.id).modify({ clubId: null })
    await db.clubs.delete(club.id)
  }

  const startEdit = (club: Club) => {
    setEditingId(club.id ?? null)
    setEditingName(club.name)
  }

  const saveEdit = async () => {
    if (!editingId) return
    const name = editingName.trim()
    if (!name) return
    await db.clubs.update(editingId, { name })
    setEditingId(null)
    setEditingName('')
    if (returnTo) navigate(returnTo, { state: returnState })
  }

  return (
    <div className="min-h-full bg-zinc-950">
      <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
        <button onClick={navigateBack} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
          <ChevronLeft size={24} strokeWidth={2} />
        </button>
        <h1 className="flex-1 font-bold text-zinc-100">{t('Clubs')}</h1>
      </div>

      <div className="px-4 space-y-4 pb-6">
        <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
          <label className="text-xs text-gold font-semibold tracking-wide">{t('ADD CLUB')}</label>
          <input
            type="text"
            value={newClubName}
            onChange={e => setNewClubName(e.target.value)}
            placeholder={t('e.g. Main Dojo')}
            className={inputCls}
          />
          <button
            onClick={handleAdd}
            className="w-full bg-gold text-black font-semibold py-2.5 rounded-xl active:bg-gold-light"
          >
            {t('Add Club')}
          </button>
        </div>

        {clubs?.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-8">{t('No clubs yet. Add one above.')}</div>
        ) : (
          <div className="space-y-3">
            {clubs?.map((club, index) => (
              <div key={club.id} className="bg-zinc-900 rounded-2xl p-4 space-y-3">
                {editingId === club.id ? (
                  <>
                    <input
                      type="text"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      className={inputCls}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="flex-1 bg-gold text-black font-semibold py-2 rounded-xl active:bg-gold-light"
                      >
                        {t('Save')}
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditingName('') }}
                        className="flex-1 bg-zinc-800 text-zinc-300 font-semibold py-2 rounded-xl active:bg-zinc-700"
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="font-semibold text-zinc-100">{club.name}</div>
                        <div className="text-xs text-zinc-500">{t('Order')} {index + 1}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMove(index, -1)}
                          className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-400 active:bg-zinc-700 flex items-center justify-center"
                          aria-label={t('Move up')}
                        >
                          <ChevronUp size={16} strokeWidth={2} />
                        </button>
                        <button
                          onClick={() => handleMove(index, 1)}
                          className="w-9 h-9 rounded-lg bg-zinc-800 text-zinc-400 active:bg-zinc-700 flex items-center justify-center"
                          aria-label={t('Move down')}
                        >
                          <ChevronDown size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(club)}
                        className="flex-1 bg-zinc-800 text-zinc-200 font-semibold py-2 rounded-xl active:bg-zinc-700"
                      >
                        {t('Edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(club)}
                        className="flex-1 bg-red-900/60 text-red-200 font-semibold py-2 rounded-xl active:bg-red-900"
                      >
                        {t('Delete')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
