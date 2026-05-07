'use client'

interface Props {
  label:           string
  firmaExistente?: string | null
  nombreFirmante?: string | null
  fechaFirma?:     string | null
  onAbrir:         () => void
}

export default function FirmaInline({
  label, firmaExistente, nombreFirmante, fechaFirma, onAbrir,
}: Props) {

  // ── FIRMA YA GUARDADA ────────────────────────────────────────────────────
  if (firmaExistente) {
    return (
      <div className="flex-1 border border-[#C8E6C9] rounded-lg p-2.5 bg-[#EBF7EE]">
        <p className="text-[10px] font-bold text-[#718096] uppercase tracking-widest mb-1.5">
          {label}
        </p>
        <img
          src={firmaExistente}
          alt={`Firma ${label}`}
          className="w-full h-8 object-contain bg-white rounded px-1"
        />
        <p className="text-[11px] font-semibold text-[#1A202C] mt-1.5 truncate">
          {nombreFirmante}
        </p>
        <p className="text-[10px] text-[#718096]">{fechaFirma}</p>
        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[#1e7e34]">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Verificado
        </span>
      </div>
    )
  }

  // ── SIN FIRMA: botón que abre el modal ─────────────────────────────────
  return (
    <button
      onClick={onAbrir}
      className="flex-1 flex flex-col items-center justify-center gap-1.5 border border-dashed border-[#C8E6C9] rounded-lg py-3 text-[#A0AEC0] hover:border-[#28A745] hover:text-[#28A745] hover:bg-[#FAFFF9] transition-all group"
    >
      <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
      <span className="text-[11px] font-medium">{label}</span>
      <span className="text-[10px]">Toque para firmar</span>
    </button>
  )
}
