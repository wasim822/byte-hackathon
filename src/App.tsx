import { useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'
import { Minimap, FullMap } from './ui/Minimap'
import { DistrictName } from './ui/DistrictName'
import { VisitPopup } from './ui/VisitPopup'
import { useGameStore } from './store/gameStore'
import { CityData } from './city/generateCity'

function App() {
  const [cityData, setCityData] = useState<CityData | null>(null)
  const mapOpen = useGameStore((state) => state.mapOpen)
  const toggleMap = useGameStore((state) => state.toggleMap)
  const setMapOpen = useGameStore((state) => state.setMapOpen)

  // Handle M key for map toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyM' && !e.repeat) {
        toggleMap()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleMap])

  const handleCityGenerated = useCallback((data: CityData) => {
    setCityData(data)
  }, [])

  const handleCloseMap = useCallback(() => {
    setMapOpen(false)
  }, [setMapOpen])

  return (
    <>
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 1,
        }}
        camera={{
          position: [0, 50, 50],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
      >
        <Scene onCityGenerated={handleCityGenerated} />
      </Canvas>

      {/* UI Layer */}
      {cityData && <Minimap cityData={cityData} />}
      <DistrictName />

      {/* Full screen map */}
      {mapOpen && cityData && <FullMap cityData={cityData} onClose={handleCloseMap} />}

      {/* Visit popup */}
      <VisitPopup />

      {/* Controls hint */}
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          color: '#00000066',
          fontSize: 12,
          fontFamily: 'monospace',
          pointerEvents: 'none',
          textShadow: '0 0 4px white',
        }}
      >
        WASD: Drive | Shift: Boost | E: Visit | M: Map
      </div>
    </>
  )
}

export default App
