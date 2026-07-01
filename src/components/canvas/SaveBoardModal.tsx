"use client"
import { AlertCircle, X } from "lucide-react"

type SaveBoardModalProps = {
  isOpen: boolean
  onClose: () => void
  onSaveAndLeave: () => void
  onLeaveWithoutSaving: () => void
}

export function SaveBoardModal({
  isOpen,
  onClose,
  onSaveAndLeave,
  onLeaveWithoutSaving,
}: SaveBoardModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 flex flex-col gap-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 text-zinc-100 font-bold text-lg">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
              <AlertCircle className="h-5 w-5" />
            </div>
            Keep this board locally?
          </div>
          <button
            type="button"
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-zinc-400 text-sm leading-relaxed">
          Would you like to keep this board saved on your device before leaving?
          If you choose to remove it, it will be deleted from your recent
          boards.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-end mt-2">
          <button
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors border border-transparent hover:border-zinc-700"
            onClick={onLeaveWithoutSaving}
          >
            Remove completely
          </button>
          <button
            type="button"
            className="w-full sm:w-auto px-5 py-2.5 text-sm font-bold text-zinc-900 bg-white hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98] rounded-xl transition-all shadow-lg shadow-white/10"
            onClick={onSaveAndLeave}
          >
            Keep locally
          </button>
        </div>
      </div>
    </div>
  )
}
