import { Suspense, useMemo, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom, Vignette, SMAA, N8AO } from '@react-three/postprocessing'
import { Sky, Environment } from '@react-three/drei'
import { generateCity } from '../city/generateCity'
import { CityRoads } from './CityRoads'
import { CityBuildings } from './CityBuildings'
import { CityEnvironment } from './CityEnvironment'
import { Car, setPlaceLotPositions } from './Car'
import { ChaseCamera } from './ChaseCamera'
import { useGameStore } from '../store/gameStore'
import * as THREE from 'three'

interface SceneProps {
  onCityGenerated: (cityData: ReturnType<typeof generateCity>) => void
}

// Following directional light that casts shadows
function FollowingSunLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const carPosition = useGameStore((state) => state.carPosition)

  useFrame(() => {
    if (!lightRef.current || !carPosition) return

    // Light follows car position, offset to the side
    lightRef.current.position.set(
      carPosition.x + 60,
      60,
      carPosition.z + 30
    )
    lightRef.current.target.position.set(
      carPosition.x,
      0,
      carPosition.z
    )
    lightRef.current.target.updateMatrixWorld()
  })

  return (
    <directionalLight
      ref={lightRef}
      intensity={2}
      color="#fffaf0"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={1}
      shadow-camera-far={200}
      shadow-camera-left={-60}
      shadow-camera-right={60}
      shadow-camera-top={60}
      shadow-camera-bottom={-60}
      shadow-bias={-0.0005}
      shadow-radius={2} // Soft edges
    >
      <primitive object={new THREE.Object3D()} attach="target" />
    </directionalLight>
  )
}

export function Scene({ onCityGenerated }: SceneProps) {
  const graphicsQuality = useGameStore((state) => state.graphicsQuality)

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

  // Determine shadow settings based on quality
  const shadowsEnabled = graphicsQuality !== 'low'

  return (
    <>
      {/* Sky */}
      <Sky sunPosition={[100, 60, 50]} />

      {/* HDRI environment for reflections only */}
      <Environment files="/assets/hdri/city-day-1k.hdr" background={false} />

      {/* Hemisphere light (sky/ground fill) */}
      <hemisphereLight args={['#87ceeb', '#8b7355', 0.8]} />

      {/* Following directional sun light with shadows */}
      {shadowsEnabled ? (
        <FollowingSunLight />
      ) : (
        <directionalLight
          position={[100, 60, 50]}
          intensity={2}
          color="#fffaf0"
        />
      )}

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

      {/* Post-processing effects - conditional based on quality */}
      {graphicsQuality === 'low' ? (
        <EffectComposer multisampling={0}>
          <SMAA />
          <Vignette eskil={false} offset={0.3} darkness={0.4} />
        </EffectComposer>
      ) : graphicsQuality === 'medium' ? (
        <EffectComposer multisampling={0}>
          <SMAA />
          <Bloom
            intensity={0.5}
            luminanceThreshold={1.0}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.3} darkness={0.4} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0}>
          <SMAA />
          <Bloom
            intensity={0.5}
            luminanceThreshold={1.0}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
          <Vignette eskil={false} offset={0.3} darkness={0.4} />
          <N8AO aoRadius={0.5} intensity={1} halfRes />
        </EffectComposer>
      )}
    </>
  )
}
