import { Suspense, useMemo, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Sky, Environment } from '@react-three/drei'
import { generateCity } from '../city/generateCity'
import { CityRoads } from './CityRoads'
import { CityBuildings } from './CityBuildings'
import { CityEnvironment } from './CityEnvironment'
import { Car, setPlaceLotPositions } from './Car'
import { ChaseCamera } from './ChaseCamera'
import * as THREE from 'three'

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

  // Set place lot positions for E key proximity check
  useEffect(() => {
    const positions = new Map<string, THREE.Vector3>()
    cityData.placeLots.forEach(lot => {
      positions.set(lot.place.id, new THREE.Vector3(lot.position.x, 0, lot.position.z))
    })
    setPlaceLotPositions(positions)
  }, [cityData.placeLots])

  return (
    <>
      {/* Sky */}
      <Sky sunPosition={[100, 60, 50]} />

      {/* HDRI environment for reflections only */}
      <Environment files="/assets/hdri/city-day-1k.hdr" background={false} />

      {/* Hemisphere light (sky/ground fill) */}
      <hemisphereLight args={['#87ceeb', '#8b7355', 0.8]} />

      {/* Directional sun light - no shadows for performance */}
      <directionalLight
        position={[100, 60, 50]}
        intensity={2}
        color="#fffaf0"
      />

      {/* Fog - light blue-grey for daytime haze */}
      <fog attach="fog" args={['#b8c4d0', 150, 700]} />

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
