"use client"
import { useState } from "react"

const COLORS = [
  "transparent",
  "#ffffff",
  "#f8f9fa",
  "#e9ecef",
  "#ced4da",
  "#adb5bd",
  "#6c757d",
  "#495057",
  "#343a40",
  "#212529",
  "#000000",
  "#ffc9c9",
  "#ffa8a8",
  "#ff8787",
  "#ff6b6b",
  "#fa5252",
  "#e03131",
  "#c92a2a",
  "#fcc419",
  "#fab005",
  "#f59f00",
  "#f08c00",
  "#e67700",
  "#d9480f",
  "#b2f2bb",
  "#8ce99a",
  "#69db7c",
  "#51cf66",
  "#40c057",
  "#37b24d",
  "#2b8a3e",
  "#99e9f2",
  "#66d9e8",
  "#3bc9db",
  "#22b8cf",
  "#15aabf",
  "#1098ad",
  "#0b7285",
  "#bac8ff",
  "#91a7ff",
  "#748ffc",
  "#5c7cfa",
  "#4c6ef5",
  "#4263eb",
  "#3b5bdb",
  "#eebefa",
  "#e599f7",
  "#daa520", // added some custom
]

type ColorSwatchProps = {
  value: string
  onChange: (hex: string) => void
  label: string
}

export function ColorSwatch({ value, onChange, label }: ColorSwatchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hexInput, setHexInput] = useState(value)

  return (
    <div className="flex flex-col gap-1 relative">
      <span className="text-xs text-zinc-400 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-8 h-8 rounded-full border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm overflow-hidden"
          style={{
            backgroundColor: value === "transparent" ? "#1a1a2e" : value,
          }} // 1a1a2e is the app background
        >
          {value === "transparent" && (
            <div className="w-full h-full relative">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjYWFhIiAvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjYWFhIiAvPgo8L3N2Zz4=')] opacity-20" />
            </div>
          )}
        </button>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          onBlur={() => {
            if (
              /^#[0-9A-Fa-f]{6}$/i.test(hexInput) ||
              hexInput === "transparent"
            ) {
              onChange(hexInput)
            } else {
              setHexInput(value)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur()
            }
          }}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500 uppercase font-mono"
        />
      </div>

      {isOpen && (
        <>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => e.key === "Escape" && setIsOpen(false)}
            role="presentation"
          />
          <div className="absolute top-12 left-0 z-50 p-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl grid grid-cols-7 gap-1 w-[204px]">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c)
                  setHexInput(c)
                  setIsOpen(false)
                }}
                className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${
                  value === c ? "border-blue-500 scale-110" : "border-zinc-700"
                }`}
                style={{
                  backgroundColor: c === "transparent" ? "transparent" : c,
                }}
                title={c}
              >
                {c === "transparent" && (
                  <div className="w-full h-full relative rounded overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjYWFhIiAvPgo8cmVjdCB4PSI0IiB5PSI0IiB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjYWFhIiAvPgo8L3N2Zz4=')] opacity-40" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
