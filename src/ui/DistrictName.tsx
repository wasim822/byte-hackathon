import { useEffect, useRef } from 'react'
import { useGameStore } from '../store/gameStore'
import { getDistrictAtPosition } from '../city/generateCity'
import { DISTRICT_INFO } from '../data/places'

export function DistrictName() {
  const carPosition = useGameStore((state) => state.carPosition)
  const currentDistrict = useGameStore((state) => state.currentDistrict)
  const setCurrentDistrict = useGameStore((state) => state.setCurrentDistrict)
  const districtDisplayName = useGameStore((state) => state.districtDisplayName)
  const districtFadeState = useGameStore((state) => state.districtFadeState)
  const showDistrictName = useGameStore((state) => state.showDistrictName)
  const setDistrictFadeState = useGameStore((state) => state.setDistrictFadeState)

  const timerRef = useRef<number | null>(null)

  // Check district on position change
  useEffect(() => {
    const district = getDistrictAtPosition(carPosition.x, carPosition.z)

    if (district !== currentDistrict) {
      setCurrentDistrict(district)

      if (district && DISTRICT_INFO[district]) {
        // Show district name
        showDistrictName(DISTRICT_INFO[district].label)
      }
    }
  }, [carPosition, currentDistrict, setCurrentDistrict, showDistrictName])

  // Handle fade state transitions
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    if (districtFadeState === 'in') {
      // Transition to hold after fade in
      timerRef.current = window.setTimeout(() => {
        setDistrictFadeState('hold')
      }, 500)
    } else if (districtFadeState === 'hold') {
      // Transition to out after hold
      timerRef.current = window.setTimeout(() => {
        setDistrictFadeState('out')
      }, 2000)
    } else if (districtFadeState === 'out') {
      // Transition to hidden after fade out
      timerRef.current = window.setTimeout(() => {
        setDistrictFadeState('hidden')
      }, 500)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [districtFadeState, setDistrictFadeState])

  if (districtFadeState === 'hidden' || !districtDisplayName) {
    return null
  }

  // Get opacity based on fade state
  let opacity = 0
  switch (districtFadeState) {
    case 'in':
      opacity = 1
      break
    case 'hold':
      opacity = 1
      break
    case 'out':
      opacity = 0
      break
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 80,
        right: 30,
        opacity,
        transition: 'opacity 0.5s ease-in-out',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontFamily: '"Kaushan Script", cursive',
          fontSize: 32,
          color: currentDistrict ? DISTRICT_INFO[currentDistrict]?.color || '#ffffff' : '#ffffff',
          textShadow: '0 0 20px currentColor, 0 0 40px currentColor, 2px 2px 4px #000000',
          whiteSpace: 'nowrap',
        }}
      >
        {districtDisplayName}
      </div>
    </div>
  )
}
