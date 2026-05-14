import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from 'react'
import {
  X, Share2, Download, Camera, Image as ImageIcon, Copy, FileText,
  Loader2, Check, MessageCircle, Send, Palette, Award, QrCode, RotateCcw, Move,
  ChevronDown,
} from 'lucide-react'
import type { SessionExportData } from '../utils/exportSession'
import {
  exportSession, buildShareCaption, shareSessionImage,
  openWhatsAppShare, openTwitterShare, copyToClipboard, downloadBlob,
} from '../utils/exportSession'
import {
  renderShareCard, loadShareImage, clampTransform, getShareCardTheme,
  SHARE_CARD_THEMES, DEFAULT_TRANSFORM,
  type ShareCardFormat, type BackgroundTransform, type ShareCardOptions,
} from '../utils/shareCard'
import {
  APP_URL, getShareThemeId, setShareThemeId, getShareFormat, setShareFormat,
  getShareShowBelt, setShareShowBelt, getShareShowQr, setShareShowQr,
} from '../utils/sharePreferences'
import {
  getUserName, setUserName, getUserNamePrompted, setUserNamePrompted,
  MAX_USER_NAME_LENGTH,
} from '../utils/userName'
import { getBeltColor, getBeltStripes, type BeltColor } from '../utils/beltRank'
import type { AppLanguage } from '../i18n'

/** Preview render resolution — a fraction of the 1080px export for snappiness. */
const PREVIEW_SCALE = 0.5

interface ShareSheetLabels {
  title: string
  formatSquare: string
  formatStory: string
  theme: string
  background: string
  addPhoto: string
  camera: string
  gallery: string
  removePhoto: string
  photoAdded: string
  zoom: string
  reset: string
  dragHint: string
  beltBranding: string
  beltSection: string
  namePlaceholder: string
  beltHint: string
  stripes: string
  qrCode: string
  qrHint: string
  on: string
  share: string
  savePng: string
  whatsapp: string
  twitter: string
  copyCaption: string
  exportText: string
  rendering: string
  copied: string
  savedHint: string
  shareError: string
  imageError: string
  customPhoto: string
  namePromptTitle: string
  namePromptBody: string
  skip: string
  saveContinue: string
}

const LABELS: Record<AppLanguage, ShareSheetLabels> = {
  en: {
    title: 'Share session',
    formatSquare: 'Square',
    formatStory: 'Story',
    theme: 'Card theme',
    background: 'Background photo',
    addPhoto: 'Background photo',
    camera: 'Camera',
    gallery: 'Gallery',
    removePhoto: 'Remove photo',
    photoAdded: 'Photo added',
    zoom: 'Zoom',
    reset: 'Reset',
    dragHint: 'Drag the preview to reposition',
    beltBranding: 'Show belt & name',
    beltSection: 'Belt & name',
    namePlaceholder: 'Your name (optional)',
    beltHint: 'Belt',
    stripes: 'stripes',
    qrCode: 'QR code',
    qrHint: 'Adds a scannable link to the app',
    on: 'On',
    share: 'Share',
    savePng: 'Save PNG',
    whatsapp: 'WhatsApp',
    twitter: 'X',
    copyCaption: 'Copy caption',
    exportText: 'Export as text',
    rendering: 'Building image…',
    copied: 'Caption copied',
    savedHint: 'Image saved — open Instagram or your gallery to post',
    shareError: 'Could not share — please try again',
    imageError: 'Could not load that image',
    customPhoto: 'Custom photo added',
    namePromptTitle: 'Add your name?',
    namePromptBody: 'It will appear on your shared session cards. You can change it later in Settings.',
    skip: 'Skip',
    saveContinue: 'Save & continue',
  },
  es: {
    title: 'Compartir sesión',
    formatSquare: 'Cuadrado',
    formatStory: 'Historia',
    theme: 'Tema de la tarjeta',
    background: 'Foto de fondo',
    addPhoto: 'Foto de fondo',
    camera: 'Cámara',
    gallery: 'Galería',
    removePhoto: 'Quitar foto',
    photoAdded: 'Foto añadida',
    zoom: 'Zoom',
    reset: 'Restablecer',
    dragHint: 'Arrastra la vista previa para reposicionar',
    beltBranding: 'Mostrar cinturón y nombre',
    beltSection: 'Cinturón y nombre',
    namePlaceholder: 'Tu nombre (opcional)',
    beltHint: 'Cinturón',
    stripes: 'grados',
    qrCode: 'Código QR',
    qrHint: 'Añade un enlace escaneable a la app',
    on: 'Activado',
    share: 'Compartir',
    savePng: 'Guardar PNG',
    whatsapp: 'WhatsApp',
    twitter: 'X',
    copyCaption: 'Copiar texto',
    exportText: 'Exportar como texto',
    rendering: 'Generando imagen…',
    copied: 'Texto copiado',
    savedHint: 'Imagen guardada — abre Instagram o tu galería para publicar',
    shareError: 'No se pudo compartir, inténtalo de nuevo',
    imageError: 'No se pudo cargar la imagen',
    customPhoto: 'Foto personalizada añadida',
    namePromptTitle: '¿Añadir tu nombre?',
    namePromptBody: 'Aparecerá en tus tarjetas de sesión compartidas. Puedes cambiarlo luego en Ajustes.',
    skip: 'Omitir',
    saveContinue: 'Guardar y continuar',
  },
  fr: {
    title: 'Partager la session',
    formatSquare: 'Carré',
    formatStory: 'Story',
    theme: 'Thème de la carte',
    background: 'Photo de fond',
    addPhoto: 'Photo de fond',
    camera: 'Caméra',
    gallery: 'Galerie',
    removePhoto: 'Retirer la photo',
    photoAdded: 'Photo ajoutée',
    zoom: 'Zoom',
    reset: 'Réinitialiser',
    dragHint: 'Glissez l’aperçu pour repositionner',
    beltBranding: 'Afficher ceinture et nom',
    beltSection: 'Ceinture et nom',
    namePlaceholder: 'Votre nom (facultatif)',
    beltHint: 'Ceinture',
    stripes: 'barrettes',
    qrCode: 'QR code',
    qrHint: 'Ajoute un lien scannable vers l’app',
    on: 'Activé',
    share: 'Partager',
    savePng: 'Enregistrer PNG',
    whatsapp: 'WhatsApp',
    twitter: 'X',
    copyCaption: 'Copier le texte',
    exportText: 'Exporter en texte',
    rendering: 'Création de l’image…',
    copied: 'Texte copié',
    savedHint: 'Image enregistrée — ouvrez Instagram ou votre galerie',
    shareError: 'Échec du partage, réessayez',
    imageError: 'Impossible de charger cette image',
    customPhoto: 'Photo personnalisée ajoutée',
    namePromptTitle: 'Ajouter votre nom ?',
    namePromptBody: 'Il apparaîtra sur vos cartes de session partagées. Modifiable plus tard dans les réglages.',
    skip: 'Ignorer',
    saveContinue: 'Enregistrer et continuer',
  },
}

const BELT_LABELS: Record<AppLanguage, Record<BeltColor, string>> = {
  en: { white: 'White', blue: 'Blue', purple: 'Purple', brown: 'Brown', black: 'Black' },
  es: { white: 'Blanco', blue: 'Azul', purple: 'Morado', brown: 'Marrón', black: 'Negro' },
  fr: { white: 'Blanche', blue: 'Bleue', purple: 'Violette', brown: 'Marron', black: 'Noire' },
}

interface Props {
  data: SessionExportData
  language: AppLanguage
  locale: string | undefined
  onClose: () => void
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${on ? 'bg-gold' : 'bg-zinc-700'}`}>
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </span>
  )
}

function CollapsibleSection({
  icon, title, summary, children,
}: {
  icon: ReactNode
  title: string
  summary?: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl bg-zinc-800/40 border border-zinc-800">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-gold shrink-0">{icon}</span>
        <span className="flex-1 text-sm font-semibold text-zinc-200">{title}</span>
        {summary && !open && <span className="text-xs text-gold-light">{summary}</span>}
        <ChevronDown
          size={16}
          strokeWidth={2}
          className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-3 pb-3 pt-0.5 space-y-2">{children}</div>}
    </div>
  )
}

export default function ShareSheet({ data, language, locale, onClose }: Props) {
  const L = LABELS[language] ?? LABELS.en
  // The underlying session does not change while the sheet is open — freeze it
  // so the preview only re-renders in response to share-option changes.
  const [sessionData] = useState(data)

  const [format, setFormat] = useState<ShareCardFormat>(getShareFormat)
  const [background, setBackground] = useState<CanvasImageSource | null>(null)
  const [transform, setTransform] = useState<BackgroundTransform>(DEFAULT_TRANSFORM)
  const [themeId, setThemeId] = useState(getShareThemeId)
  const [showBelt, setShowBelt] = useState(getShareShowBelt)
  const [showQr, setShowQr] = useState(getShareShowQr)
  const [name, setName] = useState(getUserName)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(true)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [namePromptFor, setNamePromptFor] = useState<null | 'share' | 'save'>(null)
  const [namePromptValue, setNamePromptValue] = useState('')

  const [beltColor] = useState(getBeltColor)
  const [beltStripes] = useState(getBeltStripes)

  const previewUrlRef = useRef<string | null>(null)
  const previewImgRef = useRef<HTMLImageElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const transformRef = useRef(transform)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const throttleRef = useRef<{ last: number; timer: number }>({ last: 0, timer: 0 })

  const theme = useMemo(() => getShareCardTheme(themeId), [themeId])
  const belt = useMemo(
    () => (showBelt ? { color: beltColor, stripes: beltStripes, name: name.trim() || undefined } : null),
    [showBelt, beltColor, beltStripes, name],
  )
  const qrUrl = showQr ? APP_URL : null
  const caption = buildShareCaption(sessionData, language)

  useEffect(() => { transformRef.current = transform }, [transform])
  useEffect(() => { setShareThemeId(themeId) }, [themeId])
  useEffect(() => { setShareShowBelt(showBelt) }, [showBelt])
  useEffect(() => { setShareShowQr(showQr) }, [showQr])

  useEffect(() => {
    let cancelled = false
    setRendering(true)
    renderShareCard(sessionData, language, locale, {
      format, theme, background, backgroundTransform: transform, belt, qrUrl,
      pixelScale: PREVIEW_SCALE,
    })
      .then(blob => {
        if (cancelled) return
        const url = URL.createObjectURL(blob)
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = url
        setPreviewUrl(url)
        setRendering(false)
      })
      .catch(() => {
        if (!cancelled) setRendering(false)
      })
    return () => { cancelled = true }
  }, [sessionData, language, locale, format, background, transform, theme, belt, qrUrl])

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    window.clearTimeout(throttleRef.current.timer)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2800)
  }

  // Leading + trailing throttle so dragging/zooming stays responsive without
  // re-rendering the preview on every pointer event.
  const commitTransform = useCallback((next: BackgroundTransform) => {
    transformRef.current = next
    const now = Date.now()
    const elapsed = now - throttleRef.current.last
    window.clearTimeout(throttleRef.current.timer)
    if (elapsed >= 90) {
      throttleRef.current.last = now
      setTransform(next)
    } else {
      throttleRef.current.timer = window.setTimeout(() => {
        throttleRef.current.last = Date.now()
        setTransform(transformRef.current)
      }, 90 - elapsed)
    }
  }, [])

  /** Render options at full export resolution. */
  const exportOptions = (): ShareCardOptions => ({
    format, theme, background, backgroundTransform: transform, belt, qrUrl, pixelScale: 1,
  })

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const img = await loadShareImage(file)
      setBackground(img)
      setTransform(DEFAULT_TRANSFORM)
      showToast(L.customPhoto)
    } catch {
      showToast(L.imageError)
    }
  }

  const handleSelectFormat = (next: ShareCardFormat) => {
    setFormat(next)
    setShareFormat(next)
    setTransform(DEFAULT_TRANSFORM)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (!background) return
    dragRef.current = { x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !background) return
    const img = previewImgRef.current
    if (!img || !img.clientWidth) return
    const ratio = 1080 / img.clientWidth
    const dx = (e.clientX - dragRef.current.x) * ratio
    const dy = (e.clientY - dragRef.current.y) * ratio
    dragRef.current = { x: e.clientX, y: e.clientY }
    const t = transformRef.current
    commitTransform(clampTransform(background, format, { ...t, x: t.x + dx, y: t.y + dy }))
  }
  const onPointerUp = () => {
    if (!dragRef.current) return
    dragRef.current = null
    setTransform(transformRef.current)
  }

  const handleZoom = (value: number) => {
    if (!background) return
    commitTransform(clampTransform(background, format, { ...transformRef.current, scale: value }))
  }

  const doShare = async (opts: ShareCardOptions) => {
    setBusy(true)
    try {
      const blob = await renderShareCard(sessionData, language, locale, opts)
      const result = await shareSessionImage(blob, sessionData.session, caption, language)
      if (result.method === 'download') showToast(L.savedHint)
    } catch {
      showToast(L.shareError)
    } finally {
      setBusy(false)
    }
  }

  const doSave = async (opts: ShareCardOptions) => {
    setBusy(true)
    try {
      const blob = await renderShareCard(sessionData, language, locale, opts)
      const d = new Date(sessionData.session.date)
      const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      downloadBlob(blob, `bjj-session-${stamp}.png`)
      showToast(L.savedHint)
    } catch {
      showToast(L.shareError)
    } finally {
      setBusy(false)
    }
  }

  /** Returns true when the first-share name prompt was opened instead. */
  const promptedForName = (action: 'share' | 'save'): boolean => {
    if (getUserName() || getUserNamePrompted()) return false
    setNamePromptValue('')
    setNamePromptFor(action)
    return true
  }

  const handleShare = () => {
    if (busy || rendering) return
    if (promptedForName('share')) return
    void doShare(exportOptions())
  }

  const handleSave = () => {
    if (busy || rendering) return
    if (promptedForName('save')) return
    void doSave(exportOptions())
  }

  const resolveNamePrompt = (withName: boolean) => {
    const action = namePromptFor
    setNamePromptFor(null)
    setUserNamePrompted()
    let opts = exportOptions()
    const trimmed = namePromptValue.trim()
    if (withName && trimmed) {
      setUserName(trimmed)
      setName(trimmed)
      setShowBelt(true)
      opts = { ...opts, belt: { color: beltColor, stripes: beltStripes, name: trimmed } }
    }
    if (action === 'share') void doShare(opts)
    else if (action === 'save') void doSave(opts)
  }

  const handleCopy = async () => {
    if (await copyToClipboard(caption)) showToast(L.copied)
  }

  const handleExportText = async () => {
    if (busy) return
    setBusy(true)
    try {
      await exportSession(sessionData, language, locale)
    } finally {
      setBusy(false)
    }
  }

  const updateName = (value: string) => {
    setName(value)
    setUserName(value)
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={L.title}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-zinc-900 border border-zinc-800"
      >
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm flex items-center gap-3 px-4 py-3 border-b border-zinc-800 z-10">
          <Share2 size={18} className="text-gold" strokeWidth={2} />
          <h2 className="flex-1 font-bold text-zinc-100">{L.title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 text-zinc-400 active:text-zinc-100"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Preview */}
          <div
            className={`relative bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center min-h-[180px] ${
              background ? 'cursor-move touch-none' : ''
            }`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {previewUrl && (
              <img
                ref={previewImgRef}
                src={previewUrl}
                alt={L.title}
                draggable={false}
                className="w-full h-auto max-h-[48dvh] object-contain pointer-events-none select-none"
                style={{ aspectRatio: format === 'square' ? '1 / 1' : '9 / 16' }}
              />
            )}
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-zinc-950/60 text-zinc-300 text-sm">
                <Loader2 size={16} className="animate-spin" />
                {L.rendering}
              </div>
            )}
            {background && !rendering && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/70 text-zinc-200 text-[11px] px-2.5 py-1 rounded-full pointer-events-none">
                <Move size={11} strokeWidth={2} />
                {L.dragHint}
              </div>
            )}
          </div>

          {/* Format toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(['square', 'story'] as const).map(f => (
              <button
                key={f}
                onClick={() => handleSelectFormat(f)}
                className={`py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  format === f
                    ? 'bg-gold/20 border-gold text-gold-light'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 active:bg-zinc-700'
                }`}
              >
                {f === 'square' ? L.formatSquare : L.formatStory}
              </button>
            ))}
          </div>

          {/* Theme picker */}
          <div>
            <div className="flex items-center gap-2 text-xs text-gold mb-2">
              <Palette size={13} strokeWidth={2} />
              {L.theme}
            </div>
            <div className="flex gap-2">
              {SHARE_CARD_THEMES.map(th => (
                <button
                  key={th.id}
                  onClick={() => setThemeId(th.id)}
                  aria-label={th.label[language]}
                  title={th.label[language]}
                  className={`flex-1 h-11 rounded-lg border-2 flex items-center justify-center transition-colors ${
                    themeId === th.id ? 'border-white' : 'border-zinc-700'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${th.gradient[0]}, ${th.gradient[1]})` }}
                >
                  <span className="block w-3.5 h-3.5 rounded-full" style={{ background: th.accent }} />
                </button>
              ))}
            </div>
          </div>

          {/* Background photo */}
          <CollapsibleSection
            icon={<ImageIcon size={16} strokeWidth={2} />}
            title={L.background}
            summary={background ? L.photoAdded : undefined}
          >
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-semibold text-zinc-200 active:bg-zinc-700"
              >
                <Camera size={16} strokeWidth={2} />
                {L.camera}
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-semibold text-zinc-200 active:bg-zinc-700"
              >
                <ImageIcon size={16} strokeWidth={2} />
                {L.gallery}
              </button>
            </div>
            {background && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 w-10">{L.zoom}</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={transform.scale}
                    onChange={e => handleZoom(Number(e.target.value))}
                    className="flex-1 accent-gold"
                    aria-label={L.zoom}
                  />
                  <button
                    onClick={() => setTransform(DEFAULT_TRANSFORM)}
                    className="flex items-center gap-1 text-xs font-semibold text-zinc-400 active:text-zinc-200"
                  >
                    <RotateCcw size={13} strokeWidth={2} />
                    {L.reset}
                  </button>
                </div>
                <button
                  onClick={() => { setBackground(null); setTransform(DEFAULT_TRANSFORM) }}
                  className="w-full py-2 rounded-lg bg-zinc-800/60 text-xs font-semibold text-zinc-400 active:bg-zinc-700"
                >
                  {L.removePhoto}
                </button>
              </div>
            )}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => { void handleFile(e.target.files?.[0]); e.target.value = '' }}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { void handleFile(e.target.files?.[0]); e.target.value = '' }}
            />
          </CollapsibleSection>

          {/* Belt + name branding */}
          <CollapsibleSection
            icon={<Award size={16} strokeWidth={2} />}
            title={L.beltSection}
            summary={showBelt ? (name.trim() || BELT_LABELS[language][beltColor]) : undefined}
          >
            <button
              onClick={() => setShowBelt(v => !v)}
              className="w-full flex items-center gap-3 py-1 text-left"
            >
              <span className="flex-1 text-sm font-semibold text-zinc-200">{L.beltBranding}</span>
              <Toggle on={showBelt} />
            </button>
            {showBelt && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={name}
                  maxLength={MAX_USER_NAME_LENGTH}
                  onChange={e => updateName(e.target.value)}
                  placeholder={L.namePlaceholder}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
                />
                <p className="text-xs text-zinc-500">
                  {L.beltHint}: {BELT_LABELS[language][beltColor]} · {beltStripes} {L.stripes}
                </p>
              </div>
            )}
          </CollapsibleSection>

          {/* QR code */}
          <CollapsibleSection
            icon={<QrCode size={16} strokeWidth={2} />}
            title={L.qrCode}
            summary={showQr ? L.on : undefined}
          >
            <button
              onClick={() => setShowQr(v => !v)}
              className="w-full flex items-center gap-3 py-1 text-left"
            >
              <span className="flex-1 text-sm font-semibold text-zinc-200">{L.qrHint}</span>
              <Toggle on={showQr} />
            </button>
          </CollapsibleSection>

          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleShare}
              disabled={busy || rendering}
              className="flex items-center justify-center gap-2 py-3 rounded-lg bg-gold text-zinc-950 text-sm font-bold active:bg-gold-light disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} strokeWidth={2.5} />}
              {L.share}
            </button>
            <button
              onClick={handleSave}
              disabled={busy || rendering}
              className="flex items-center justify-center gap-2 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-bold text-zinc-100 active:bg-zinc-700 disabled:opacity-50"
            >
              <Download size={16} strokeWidth={2.5} />
              {L.savePng}
            </button>
          </div>

          {/* Quick share targets */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => openWhatsAppShare(caption)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 active:bg-zinc-700"
            >
              <MessageCircle size={18} strokeWidth={2} className="text-green-400" />
              {L.whatsapp}
            </button>
            <button
              onClick={() => openTwitterShare(caption)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 active:bg-zinc-700"
            >
              <Send size={18} strokeWidth={2} className="text-sky-400" />
              {L.twitter}
            </button>
            <button
              onClick={() => void handleCopy()}
              className="flex flex-col items-center gap-1 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 active:bg-zinc-700"
            >
              <Copy size={18} strokeWidth={2} className="text-gold" />
              {L.copyCaption}
            </button>
          </div>

          {/* Text export fallback */}
          <button
            onClick={() => void handleExportText()}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-zinc-400 active:text-zinc-200 disabled:opacity-50"
          >
            <FileText size={15} strokeWidth={2} />
            {L.exportText}
          </button>
        </div>

        {toast && (
          <div className="sticky bottom-0 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 px-4 py-3 flex items-center gap-2 text-sm text-gold-light">
            <Check size={16} strokeWidth={2.5} className="shrink-0" />
            {toast}
          </div>
        )}

        {/* First-share name prompt */}
        {namePromptFor && (
          <div
            className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
            onClick={() => resolveNamePrompt(false)}
          >
            <div
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={L.namePromptTitle}
              className="w-full max-w-xs bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-3"
            >
              <h3 className="font-bold text-zinc-100">{L.namePromptTitle}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{L.namePromptBody}</p>
              <input
                type="text"
                autoFocus
                value={namePromptValue}
                maxLength={MAX_USER_NAME_LENGTH}
                onChange={e => setNamePromptValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') resolveNamePrompt(true) }}
                placeholder={L.namePlaceholder}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => resolveNamePrompt(false)}
                  className="flex-1 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-semibold text-zinc-300 active:bg-zinc-700"
                >
                  {L.skip}
                </button>
                <button
                  onClick={() => resolveNamePrompt(true)}
                  className="flex-1 py-2.5 rounded-lg bg-gold text-zinc-950 text-sm font-bold active:bg-gold-light"
                >
                  {L.saveContinue}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
