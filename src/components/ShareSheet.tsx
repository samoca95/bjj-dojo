import { useEffect, useRef, useState } from 'react'
import {
  X, Share2, Download, Camera, Image as ImageIcon, Copy, FileText,
  Loader2, Check, MessageCircle, Send,
} from 'lucide-react'
import type { SessionExportData } from '../utils/exportSession'
import {
  exportSession, buildShareCaption, shareSessionImage,
  openWhatsAppShare, openTwitterShare, copyToClipboard, downloadBlob,
} from '../utils/exportSession'
import { renderShareCard, loadShareImage, type ShareCardFormat } from '../utils/shareCard'
import type { AppLanguage } from '../i18n'

interface ShareSheetLabels {
  title: string
  formatSquare: string
  formatStory: string
  addPhoto: string
  camera: string
  gallery: string
  removePhoto: string
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
    addPhoto: 'Background photo',
    camera: 'Camera',
    gallery: 'Gallery',
    removePhoto: 'Remove photo',
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
    addPhoto: 'Foto de fondo',
    camera: 'Cámara',
    gallery: 'Galería',
    removePhoto: 'Quitar foto',
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
    addPhoto: 'Photo de fond',
    camera: 'Caméra',
    gallery: 'Galerie',
    removePhoto: 'Retirer la photo',
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

interface Props {
  data: SessionExportData
  language: AppLanguage
  locale: string | undefined
  onClose: () => void
}

export default function ShareSheet({ data, language, locale, onClose }: Props) {
  const L = LABELS[language] ?? LABELS.en
  const [format, setFormat] = useState<ShareCardFormat>('square')
  const [background, setBackground] = useState<CanvasImageSource | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(true)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const blobRef = useRef<Blob | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const caption = buildShareCaption(data, language)

  useEffect(() => {
    let cancelled = false
    setRendering(true)
    renderShareCard(data, language, locale, { format, background })
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
  }, [data, language, locale, format, background])

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2600)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const img = await loadShareImage(file)
      setBackground(img)
      showToast(L.customPhoto)
    } catch {
      showToast(L.imageError)
    }
  }

  const handleShare = async () => {
    if (!blobRef.current || busy) return
    setBusy(true)
    try {
      const result = await shareSessionImage(blobRef.current, data.session, caption, language)
      if (result.method === 'download') showToast(L.saved)
    } finally {
      setBusy(false)
    }
  }

  const handleSave = () => {
    if (!blobRef.current) return
    const d = new Date(data.session.date)
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    downloadBlob(blobRef.current, `bjj-session-${stamp}.png`)
    showToast(L.saved)
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(caption)
    if (ok) showToast(L.copied)
  }

  const handleExportText = async () => {
    if (busy) return
    setBusy(true)
    try {
      await exportSession(data, language, locale)
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
        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-sm flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
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
          <div className="relative bg-zinc-950 rounded-xl overflow-hidden flex items-center justify-center min-h-[180px]">
            {previewUrl && (
              <img
                src={previewUrl}
                alt={L.title}
                className="w-full h-auto max-h-[48dvh] object-contain"
                style={{ aspectRatio: format === 'square' ? '1 / 1' : '9 / 16' }}
              />
            )}
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-zinc-950/60 text-zinc-300 text-sm">
                <Loader2 size={16} className="animate-spin" />
                {L.rendering}
              </div>
            )}
          </div>

          {/* Format toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(['square', 'story'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
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
              <button
                onClick={() => setBackground(null)}
                className="mt-2 w-full py-2 rounded-lg bg-zinc-800/60 text-xs font-semibold text-zinc-400 active:bg-zinc-700"
              >
                {L.removePhoto}
              </button>
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

          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-2">
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
