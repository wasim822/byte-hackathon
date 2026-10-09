import { useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'
import { Minimap, FullMap } from './ui/Minimap'
import { DistrictName } from './ui/DistrictName'
import { VisitPopup } from './ui/VisitPopup'
import { LoadingScreen } from './ui/LoadingScreen'
import { useGameStore, GraphicsQuality } from './store/gameStore'
import { CityData } from './city/generateCity'

// Controls hint component with fade
function ControlsHint() {
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    // Start fading after 5 seconds
    const fadeTimeout = setTimeout(() => {
      const fadeInterval = setInterval(() => {
        setOpacity(prev => {
          if (prev <= 0) {
            clearInterval(fadeInterval)
            return 0
          }
          return prev - 0.02
        })
      }, 50)

      return () => clearInterval(fadeInterval)
    }, 5000)

    return () => clearTimeout(fadeTimeout)
  }, [])

  if (opacity <= 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        color: '#00000088',
        fontSize: 12,
        fontFamily: 'monospace',
        pointerEvents: 'none',
        textShadow: '0 0 4px white',
        opacity,
        transition: 'opacity 0.1s',
      }}
    >
      WASD: Drive | Shift: Boost | E: Visit | M: Map | C: Camera
    </div>
  )
}

// Graphics quality selector
function QualitySelector() {
  const graphicsQuality = useGameStore((state) => state.graphicsQuality)
  const setGraphicsQuality = useGameStore((state) => state.setGraphicsQuality)

  const qualities: GraphicsQuality[] = ['low', 'medium', 'high']

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        display: 'flex',
        gap: 4,
        fontFamily: 'monospace',
        fontSize: 11,
      }}
    >
      {qualities.map((q) => (
        <button
          key={q}
          onClick={() => setGraphicsQuality(q)}
          style={{
            padding: '4px 8px',
            backgroundColor: graphicsQuality === q ? '#00ffff44' : '#00000044',
            border: graphicsQuality === q ? '1px solid #00ffff' : '1px solid #ffffff44',
            borderRadius: 3,
            color: graphicsQuality === q ? '#00ffff' : '#ffffff88',
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          {q}
        </button>
      ))}
    </div>
  )
}

function App() {
  const [cityData, setCityData] = useState<CityData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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

  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false)
  }, [])

  return (
    <>
      {/* Loading screen */}
      <LoadingScreen onLoaded={handleLoadingComplete} />

      <Canvas
        shadows
        gl={{
          antialias: false, // Using SMAA instead
          toneMapping: 3, // ACESFilmicToneMapping
          toneMappingExposure: 1,
        }}
        camera={{
          position: [0, 50, 50],
          fov: 55,
          near: 0.1,
          far: 1000,
        }}
      >
        <Scene onCityGenerated={handleCityGenerated} />
      </Canvas>

      {/* UI Layer - only show after loading */}
      {!isLoading && (
        <>
          {cityData && <Minimap cityData={cityData} />}
          <DistrictName />
          <ControlsHint />
          <QualitySelector />

          {/* Full screen map */}
          {mapOpen && cityData && <FullMap cityData={cityData} onClose={handleCloseMap} />}

          {/* Visit popup */}
          <VisitPopup />
        </>
      )}
    </>
  )
}

export default App
