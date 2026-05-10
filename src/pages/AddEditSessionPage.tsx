import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import type { Session, SessionType, Technique } from '../types'
import { SESSION_TYPE_LABELS } from '../types'

function toDateInput(epoch: number) {
  const d = new Date(epoch)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function fromDateInput(s: string): number {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

const inputCls =
  'w-full bg-zinc-800 rounded-xl px-4 py-3 text-zinc-100 text-sm outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600'

export default function AddEditSessionPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [date, setDate] = useState(toDateInput(Date.now()))
  const [duration, setDuration] = useState('60')
  const [sessionType, setSessionType] = useState<SessionType>('GI')
  const [location, setLocation] = useState('')
  const [partners, setPartners] = useState('')
  const [notes, setNotes] = useState('')
  const [energy, setEnergy] = useState(3)
  const [tapsGiven, setTapsGiven] = useState('0')
  const [tapsReceived, setTapsReceived] = useState('0')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSearch, setPickerSearch] = useState('')

  const allTechniques = useLiveQuery(
    () => db.techniques.orderBy('name').toArray(),
    [],
    [] as Technique[],
  )

  useEffect(() => {
    if (!isEdit || !id) return
    db.sessions.get(Number(id)).then(async s => {
      if (!s) return
      setDate(toDateInput(s.date))
      setDuration(String(s.durationMinutes))
      setSessionType(s.sessionType)
      setLocation(s.location)
      setPartners(s.partners)
      setNotes(s.notes)
      setEnergy(s.energyLevel)
      setTapsGiven(String(s.tapsGiven))
      setTapsReceived(String(s.tapsReceived))
      const sts = await db.sessionTechniques.where('sessionId').equals(Number(id)).toArray()
      setSelectedIds(new Set(sts.map(st => st.techniqueId)))
    })
  }, [id, isEdit])

  const handleSave = async () => {
    const session: Session = {
      date: fromDateInput(date),
      durationMinutes: parseInt(duration) || 60,
      sessionType,
      location: location.trim(),
      partners: partners.trim(),
      notes: notes.trim(),
      energyLevel: energy,
      tapsGiven: parseInt(tapsGiven) || 0,
      tapsReceived: parseInt(tapsReceived) || 0,
    }
    let sid: number
    if (isEdit && id) {
      session.id = Number(id)
      await db.sessions.put(session)
      await db.sessionTechniques.where('sessionId').equals(Number(id)).delete()
      sid = Number(id)
    } else {
      sid = (await db.sessions.add(session)) as number
    }
    await db.sessionTechniques.bulkAdd(
      [...selectedIds].map(tid => ({ sessionId: sid, techniqueId: tid })),
    )
    navigate(isEdit ? `/sessions/${sid}` : '/sessions')
  }

  const filteredTechniques = allTechniques?.filter(t =>
    pickerSearch === '' || t.name.toLowerCase().includes(pickerSearch.toLowerCase()),
  )

  return (
    <>
      <div className="min-h-full bg-zinc-950">
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950/90 backdrop-blur-sm px-4 pt-12 pb-4 z-10 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-zinc-400 active:text-zinc-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 font-bold text-zinc-100">{isEdit ? 'Edit Session' : 'Log Session'}</h1>
          <button onClick={handleSave} className="text-gold font-bold text-sm active:text-gold-light px-2">
            Save
          </button>
        </div>

        <div className="px-4 space-y-5 pb-8">
          {/* Session type */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">SESSION TYPE</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {(Object.keys(SESSION_TYPE_LABELS) as SessionType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setSessionType(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sessionType === t
                      ? 'bg-gold text-black'
                      : 'bg-zinc-800 text-zinc-300 active:bg-zinc-700'
                  }`}
                >
                  {SESSION_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">DATE</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={`${inputCls} mt-2 [color-scheme:dark]`}
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">DURATION (minutes)</label>
            <input
              type="number"
              inputMode="numeric"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className={`${inputCls} mt-2`}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">LOCATION</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Main Dojo, Competition"
              className={`${inputCls} mt-2`}
            />
          </div>

          {/* Partners */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">TRAINING PARTNERS</label>
            <input
              type="text"
              value={partners}
              onChange={e => setPartners(e.target.value)}
              placeholder="e.g. John, Sarah"
              className={`${inputCls} mt-2`}
            />
          </div>

          {/* Energy */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">ENERGY LEVEL</label>
            <div className="flex gap-3 mt-3 items-center">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setEnergy(n)}
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
                    n <= energy ? 'bg-gold text-black' : 'bg-zinc-800 text-zinc-500 active:bg-zinc-700'
                  }`}
                >
                  {n}
                </button>
              ))}
              <span className="text-sm text-zinc-400 ml-1">
                {['', 'Exhausted', 'Low', 'Average', 'Good', 'Peak'][energy]}
              </span>
            </div>
          </div>

          {/* Taps */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gold font-semibold tracking-wide">TAPS GIVEN</label>
              <input
                type="number"
                inputMode="numeric"
                value={tapsGiven}
                onChange={e => setTapsGiven(e.target.value)}
                className={`${inputCls} mt-2`}
              />
            </div>
            <div>
              <label className="text-xs text-gold font-semibold tracking-wide">TAPS RECEIVED</label>
              <input
                type="number"
                inputMode="numeric"
                value={tapsReceived}
                onChange={e => setTapsReceived(e.target.value)}
                className={`${inputCls} mt-2`}
              />
            </div>
          </div>

          {/* Techniques */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">TECHNIQUES PRACTICED</label>
            <button
              onClick={() => setShowPicker(true)}
              className="mt-2 w-full bg-zinc-800 rounded-xl px-4 py-3 text-sm text-left active:bg-zinc-700 transition-colors"
            >
              {selectedIds.size === 0 ? (
                <span className="text-zinc-500">Add techniques…</span>
              ) : (
                <span className="text-zinc-100">{selectedIds.size} technique{selectedIds.size !== 1 ? 's' : ''} selected</span>
              )}
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gold font-semibold tracking-wide">NOTES</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What did you work on? Any insights?"
              rows={4}
              className={`${inputCls} mt-2 resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Technique Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
          <div className="bg-zinc-900 w-full rounded-t-3xl max-h-[80vh] flex flex-col">
            <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-zinc-800">
              <h2 className="flex-1 font-bold text-zinc-100">Select Techniques</h2>
              <button onClick={() => setShowPicker(false)} className="text-gold font-semibold active:text-gold-light">
                Done ({selectedIds.size})
              </button>
            </div>
            <div className="px-4 py-3 border-b border-zinc-800">
              <input
                type="text"
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder="Search…"
                className="w-full bg-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-gold placeholder-zinc-600"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredTechniques?.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedIds(prev => {
                      const next = new Set(prev)
                      next.has(t.id) ? next.delete(t.id) : next.add(t.id)
                      return next
                    })
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/50 active:bg-zinc-800 text-left"
                >
                  <div className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                    selectedIds.has(t.id) ? 'bg-gold border-gold' : 'border-zinc-600'
                  }`}>
                    {selectedIds.has(t.id) && (
                      <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-zinc-100">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
