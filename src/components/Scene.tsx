import { Suspense, useMemo } from 'react'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { generateCity } from '../city/generateCity'
import { CityRoads } from './CityRoads'
import { CityBuildings } from './CityBuildings'
import { CityEnvironment } from './CityEnvironment'
import { Car } from './Car'
import { ChaseCamera } from './ChaseCamera'

interface SceneProps {
  onCityGenerated: (cityData: ReturnType<typeof generateCity>) => void
}

export function Scene({ onCityGenerated }: SceneProps) {
  // Generate city data once
  const cityData = useMemo(() => {
    const data = generateCity()
    onCityGenerated(data)
    return data
  }, [onCityGenerated])

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[100, 150, 50]}
        intensity={0.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={500}
        shadow-camera-left={-300}
        shadow-camera-right={300}
        shadow-camera-top={300}
        shadow-camera-bottom={-300}
      />

      {/* Hemisphere light for subtle fill */}
      <hemisphereLight args={['#1a1a2e', '#0a0a0f', 0.3]} />

      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#050510', 100, 500]} />

      {/* Physics world */}
      <Suspense fallback={null}>
        <Physics gravity={[0, -20, 0]}>
          {/* City elements */}
          <CityRoads roads={cityData.roads} />
          <CityBuildings
            placeLots={cityData.placeLots}
            fillerBuildings={cityData.fillerBuildings}
            districtSigns={cityData.districtSigns}
          />
          <CityEnvironment
            streetlights={cityData.streetlights}
            trees={cityData.trees}
            blocks={cityData.blocks}
          />

          {/* Player car */}
          <Car />
        </Physics>
      </Suspense>

      {/* Camera controller */}
      <ChaseCamera />

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          intensity={1.2}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
