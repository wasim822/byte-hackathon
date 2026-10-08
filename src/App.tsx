import { Canvas } from '@react-three/fiber'
import { Scene } from './components/Scene'

function App() {
  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        toneMapping: 3, // ACESFilmicToneMapping
        toneMappingExposure: 1,
      }}
      camera={{
        position: [0, 50, 50],
        fov: 28,
        near: 0.1,
        far: 1000,
      }}
    >
      <Scene />
    </Canvas>
  )
}

export default App
