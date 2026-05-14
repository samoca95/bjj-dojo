import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import {
  X, Share2, Download, Camera, Image as ImageIcon, Copy, FileText,
  Loader2, Check, MessageCircle, Send, Palette, Award, QrCode, RotateCcw, Move,
} from 'lucide-react'
import type { SessionExportData } from '../utils/exportSession'
import {
  exportSession, buildShareCaption, shareSessionImage,
  openWhatsAppShare, openTwitterShare, copyToClipboard, downloadBlob,
} from '../utils/exportSession'
import {
  renderShareCard, loadShareImage, clampTransform, getShareCardTheme,
  SHARE_CARD_THEMES, DEFAULT_TRANSFORM,
  type ShareCardFormat, type BackgroundTransform,
} from '../utils/shareCard'
import {
  APP_URL, getShareThemeId, setShareThemeId, getShareShowBelt, setShareShowBelt,
  getShareShowQr, setShareShowQr, getShareName, setShareName,
} from '../utils/sharePreferences'
import { getBeltColor, getBeltStripes, type BeltColor } from '../utils/beltRank'
import type { AppLanguage } from '../i18n'

interface ShareSheetLabels {
  title: string
  formatSquare: string
  formatStory: string
  theme: string
  addPhoto: string
  camera: string
  gallery: string
  removePhoto: string
  zoom: string
  reset: string
  dragHint: string
  beltBranding: string
  namePlaceholder: string
  beltHint: string
  stripes: string
  qrCode: string
  qrHint: string
  share: string
  savePng: string
  whatsapp: string
  twitter: string
  copyCaption: string
  exportText: string
  rendering: string
  copied: string
  saved: string
  imageError: string
  customPhoto: string
}

const LABELS: Record<AppLanguage, ShareSheetLabels> = {
  en: {
    title: 'Share session',
    formatSquare: 'Square',
    formatStory: 'Story',
    theme: 'Card theme',
    addPhoto: 'Background photo',
    camera: 'Camera',
    gallery: 'Gallery',
    removePhoto: 'Remove photo',
    zoom: 'Zoom',
    reset: 'Reset',
    dragHint: 'Drag the preview to reposition',
    beltBranding: 'Show belt & name',
    namePlaceholder: 'Your name (optional)',
    beltHint: 'Belt',
    stripes: 'stripes',
    qrCode: 'Show QR code',
    qrHint: 'Adds a scannable link to the app',
    share: 'Share',
    savePng: 'Save PNG',
    whatsapp: 'WhatsApp',
    twitter: 'X',
    copyCaption: 'Copy caption',
    exportText: 'Export as text',
    rendering: 'Building image…',
    copied: 'Caption copied',
    saved: 'Image saved',
    imageError: 'Could not load that image',
    customPhoto: 'Custom photo added',
  },
  es: {
    title: 'Compartir sesión',
    formatSquare: 'Cuadrado',
    formatStory: 'Historia',
    theme: 'Tema de la tarjeta',
    addPhoto: 'Foto de fondo',
    camera: 'Cámara',
    gallery: 'Galería',
    removePhoto: 'Quitar foto',
    zoom: 'Zoom',
    reset: 'Restablecer',
    dragHint: 'Arrastra la vista previa para reposicionar',
    beltBranding: 'Mostrar cinturón y nombre',
    namePlaceholder: 'Tu nombre (opcional)',
    beltHint: 'Cinturón',
    stripes: 'grados',
    qrCode: 'Mostrar código QR',
    qrHint: 'Añade un enlace escaneable a la app',
    share: 'Compartir',
    savePng: 'Guardar PNG',
    whatsapp: 'WhatsApp',
    twitter: 'X',
    copyCaption: 'Copiar texto',
    exportText: 'Exportar como texto',
    rendering: 'Generando imagen…',
    copied: 'Texto copiado',
    saved: 'Imagen guardada',
    imageError: 'No se pudo cargar la imagen',
    customPhoto: 'Foto personalizada añadida',
  },
  fr: {
    title: 'Partager la session',
    formatSquare: 'Carré',
    formatStory: 'Story',
    theme: 'Thème de la carte',
    addPhoto: 'Photo de fond',
    camera: 'Caméra',
    gallery: 'Galerie',
    removePhoto: 'Retirer la photo',
    zoom: 'Zoom',
    reset: 'Réinitialiser',
    dragHint: 'Glissez l’aperçu pour repositionner',
    beltBranding: 'Afficher ceinture et nom',
    namePlaceholder: 'Votre nom (facultatif)',
    beltHint: 'Ceinture',
    stripes: 'barrettes',
    qrCode: 'Afficher le QR code',
    qrHint: 'Ajoute un lien scannable vers l’app',
    share: 'Partager',
    savePng: 'Enregistrer PNG',
    whatsapp: 'WhatsApp',
    twitter: 'X',
    copyCaption: 'Copier le texte',
    exportText: 'Exporter en texte',
    rendering: 'Création de l’image…',
    copied: 'Texte copié',
    saved: 'Image enregistrée',
    imageError: 'Impossible de charger cette image',
    customPhoto: 'Photo personnalisée ajoutée',
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

export default function ShareSheet({ data, language, locale, onClose }: Props) {
  const L = LABELS[language] ?? LABELS.en
  // The underlying session does not change while the sheet is open — freeze it
  // so the preview only re-renders in response to share-option changes.
  const [sessionData] = useState(data)

  const [format, setFormat] = useState<ShareCardFormat>('square')
  const [background, setBackground] = useState<CanvasImageSource | null>(null)
  const [transform, setTransform] = useState<BackgroundTransform>(DEFAULT_TRANSFORM)
  const [themeId, setThemeId] = useState(getShareThemeId)
  const [showBelt, setShowBelt] = useState(getShareShowBelt)
  const [showQr, setShowQr] = useState(getShareShowQr)
  const [name, setName] = useState(getShareName)

  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(true)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [beltColor] = useState(getBeltColor)
  const [beltStripes] = useState(getBeltStripes)

  const blobRef = useRef<Blob | null>(null)
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
  useEffect(() => { setShareName(name) }, [name])

  useEffect(() => {
    let cancelled = false
    setRendering(true)
    renderShareCard(sessionData, language, locale, {
      format, theme, background, backgroundTransform: transform, belt, qrUrl,
    })
      .then(blob => {
        if (cancelled) return
        blobRef.current = blob
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
    window.setTimeout(() => setToast(null), 2600)
  }

  // Leading + trailing throttle so dragging/zooming stays responsive without
  // re-rendering the full-resolution card on every pointer event.
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

  const handleShare = async () => {
    if (!blobRef.current || busy) return
    setBusy(true)
    try {
      const result = await shareSessionImage(blobRef.current, sessionData.session, caption, language)
      if (result.method === 'download') showToast(L.saved)
    } finally {
      setBusy(false)
    }
  }

  const handleSave = () => {
    if (!blobRef.current) return
    const d = new Date(sessionData.session.date)
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    downloadBlob(blobRef.current, `bjj-session-${stamp}.png`)
    showToast(L.saved)
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

        <div className="p-4 space-y-4">
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
          <div>
            <div className="text-xs text-gold mb-2">{L.addPhoto}</div>
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
              <div className="mt-3 space-y-2">
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
          </div>

          {/* Belt + name branding */}
          <div className="space-y-2">
            <button
              onClick={() => setShowBelt(v => !v)}
              className="w-full flex items-center gap-3 py-1 text-left"
            >
              <Award size={16} className="text-gold shrink-0" strokeWidth={2} />
              <span className="flex-1 text-sm font-semibold text-zinc-200">{L.beltBranding}</span>
              <Toggle on={showBelt} />
            </button>
            {showBelt && (
              <div className="space-y-2 pl-7">
                <input
                  type="text"
                  value={name}
                  maxLength={40}
                  onChange={e => setName(e.target.value)}
                  placeholder={L.namePlaceholder}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500"
                />
                <p className="text-xs text-zinc-500">
                  {L.beltHint}: {BELT_LABELS[language][beltColor]} · {beltStripes} {L.stripes}
                </p>
              </div>
            )}
          </div>

          {/* QR code */}
          <div className="space-y-1">
            <button
              onClick={() => setShowQr(v => !v)}
              className="w-full flex items-center gap-3 py-1 text-left"
            >
              <QrCode size={16} className="text-gold shrink-0" strokeWidth={2} />
              <span className="flex-1 text-sm font-semibold text-zinc-200">{L.qrCode}</span>
              <Toggle on={showQr} />
            </button>
            {showQr && <p className="text-xs text-zinc-500 pl-7">{L.qrHint}</p>}
          </div>

          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => void handleShare()}
              disabled={busy || rendering}
              className="flex items-center justify-center gap-2 py-3 rounded-lg bg-gold text-zinc-950 text-sm font-bold active:bg-gold-light disabled:opacity-50"
            >
              <Share2 size={16} strokeWidth={2.5} />
              {L.share}
            </button>
            <button
              onClick={handleSave}
              disabled={rendering}
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
            <Check size={16} strokeWidth={2.5} />
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
