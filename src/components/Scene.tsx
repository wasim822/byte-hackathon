import { Suspense } from 'react'
import { Physics } from '@react-three/rapier'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Ground } from './Ground'
import { Roads } from './Roads'
import { Buildings } from './Buildings'
import { Car } from './Car'
import { CameraController } from './CameraController'

export function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={0.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />

      {/* Fog for atmosphere */}
      <fog attach="fog" args={['#050510', 50, 400]} />

      {/* Physics world */}
      <Suspense fallback={null}>
        <Physics gravity={[0, -30, 0]} debug={false}>
          <Ground />
          <Roads />
          <Buildings />
          <Car />
        </Physics>
      </Suspense>

      {/* Camera controller */}
      <CameraController />

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.1}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </>
  )
}
