import { useEffect, useState } from 'react'
import { Bed } from 'lucide-react'

interface OccupancyHeroProps {
  occupancyRate: number
  occupiedRooms: number
  totalRooms: number
}

export function OccupancyHero({ occupancyRate, occupiedRooms, totalRooms }: OccupancyHeroProps) {
  const [animatedWidth, setAnimatedWidth] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(Math.min(occupancyRate, 100))
    }, 100)
    return () => clearTimeout(timer)
  }, [occupancyRate])

  return (
    <div className="rounded-xl border border-primary/30 bg-primary p-6 text-white">
      <div className="mb-3 flex items-center gap-2">
        <Bed className="h-4 w-4 text-white/60" />
        <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
          Current Occupancy
        </span>
      </div>

      <div className="flex items-end gap-2">
        <div>
          <span className="text-7xl font-bold tabular-nums leading-none">
            {Math.round(occupancyRate)}
            <span className="text-3xl text-white/60">%</span>
          </span>
        </div>
        <div className="mb-1 text-sm text-white/60">
          <span className="font-semibold text-white">{occupiedRooms}</span> of{' '}
          <span className="font-semibold text-white">{totalRooms}</span> rooms occupied
        </div>
      </div>

      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-success transition-all duration-700 ease-out"
          style={{ width: `${animatedWidth}%` }}
        />
      </div>
    </div>
  )
}
