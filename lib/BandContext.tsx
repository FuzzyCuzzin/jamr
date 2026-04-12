import { createContext, useContext, useState, ReactNode } from 'react'

export type Band = { id: string; name: string }

type BandContextType = {
  band: Band | null
  setBand: (band: Band) => void
  clearBand: () => void
}

const BandContext = createContext<BandContextType | null>(null)

export function BandProvider({ children }: { children: ReactNode }) {
  const [band, setBandState] = useState<Band | null>(null)

  function setBand(band: Band) {
    setBandState(band)
  }

  function clearBand() {
    setBandState(null)
  }

  return (
    <BandContext.Provider value={{ band, setBand, clearBand }}>
      {children}
    </BandContext.Provider>
  )
}

export function useBand() {
  const ctx = useContext(BandContext)
  if (!ctx) throw new Error('useBand must be used within BandProvider')
  return ctx
}
